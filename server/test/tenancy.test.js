// Cross-tenant isolation test. Run with: npm test (from /server)
import assert from "node:assert/strict";
import { openDb } from "../src/db.js";
import { createApp } from "../src/app.js";

const db = openDb(":memory:");
const server = createApp(db).listen(0);
const base = `http://localhost:${server.address().port}/api`;

async function call(method, path, body, cookie) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, data: await res.json().catch(() => ({})), cookie: setCookie?.split(";")[0] };
}

try {
  const a = await call("POST", "/auth/signup", { email: "a@test.com", password: "password123", orgName: "Org A" });
  const b = await call("POST", "/auth/signup", { email: "b@test.com", password: "password123", orgName: "Org B" });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);

  const p = await call("POST", "/products", { name: "Widget", sku: "W-1", quantity: 3 }, a.cookie);
  assert.equal(p.status, 201);
  const id = p.data.product.id;

  // Same SKU in the same org -> 409; same SKU in another org -> fine
  assert.equal((await call("POST", "/products", { name: "Dup", sku: "W-1", quantity: 1 }, a.cookie)).status, 409);
  assert.equal((await call("POST", "/products", { name: "Widget", sku: "W-1", quantity: 1 }, b.cookie)).status, 201);

  // B must not see or touch A's product
  assert.equal((await call("GET", `/products/${id}`, null, b.cookie)).status, 404);
  assert.equal((await call("PUT", `/products/${id}`, { name: "x", sku: "x", quantity: 1 }, b.cookie)).status, 404);
  assert.equal((await call("POST", `/products/${id}/adjust`, { delta: 1 }, b.cookie)).status, 404);
  assert.equal((await call("DELETE", `/products/${id}`, null, b.cookie)).status, 404);
  const listB = await call("GET", "/products", null, b.cookie);
  assert.equal(listB.data.products.length, 1);

  // Unauthenticated
  assert.equal((await call("GET", "/products")).status, 401);

  // Stock adjust can't go negative; low stock shows on dashboard (3 <= default 5)
  assert.equal((await call("POST", `/products/${id}/adjust`, { delta: -10 }, a.cookie)).status, 400);
  assert.equal((await call("POST", `/products/${id}/adjust`, { delta: 2, note: "restock" }, a.cookie)).data.product.quantity, 5);
  const dash = await call("GET", "/dashboard", null, a.cookie);
  assert.equal(dash.data.totalProducts, 1);
  assert.equal(dash.data.lowStock.length, 1);

  // Empty optional fields from forms are accepted
  const e = await call("POST", "/products", { name: "N", sku: "N-1", quantity: "4", cost_price: "", selling_price: "", low_stock_threshold: "" }, a.cookie);
  assert.equal(e.status, 201);

  console.log("All tenancy tests passed");
} finally {
  server.close();
}
