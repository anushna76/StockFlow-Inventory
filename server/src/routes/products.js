import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";

// Empty strings from forms become null for optional numeric fields.
const optNum = (schema) =>
  z.preprocess((v) => (v === "" || v === undefined ? null : v), schema.nullable());

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  sku: z.string().trim().min(1, "SKU is required").max(100),
  description: z.preprocess((v) => (v === "" ? null : v), z.string().max(2000).nullable().optional()),
  quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" }).int("Quantity must be a whole number").min(0, "Quantity cannot be negative"),
  cost_price: optNum(z.coerce.number().min(0, "Cost price cannot be negative")).optional(),
  selling_price: optNum(z.coerce.number().min(0, "Selling price cannot be negative")).optional(),
  low_stock_threshold: optNum(z.coerce.number().int().min(0, "Threshold cannot be negative")).optional(),
});

const adjustSchema = z.object({
  delta: z.coerce.number().int("Adjustment must be a whole number").refine((n) => n !== 0, "Adjustment cannot be zero"),
  note: z.string().max(500).optional(),
});

const SELECT = `
  SELECT p.*, COALESCE(p.low_stock_threshold, o.default_low_stock) AS effective_threshold,
         (p.quantity <= COALESCE(p.low_stock_threshold, o.default_low_stock)) AS is_low
  FROM products p JOIN orgs o ON o.id = p.org_id`;

export default function productRoutes(db) {
  const r = Router();
  r.use(requireAuth);

  const fail = (res, parsed) => res.status(400).json({ error: parsed.error.issues[0].message });
  const isUniqueErr = (e) => e && /UNIQUE constraint failed/i.test(String(e.message));

  r.get("/", (req, res) => {
    const q = (req.query.q || "").toString().trim();
    const like = `%${q}%`;
    const rows = q
      ? db.prepare(`${SELECT} WHERE p.org_id = ? AND (p.name LIKE ? OR p.sku LIKE ?) ORDER BY p.name`).all(req.user.orgId, like, like)
      : db.prepare(`${SELECT} WHERE p.org_id = ? ORDER BY p.name`).all(req.user.orgId);
    res.json({ products: rows });
  });

  r.get("/:id", (req, res) => {
    const p = db.prepare(`${SELECT} WHERE p.id = ? AND p.org_id = ?`).get(req.params.id, req.user.orgId);
    if (!p) return res.status(404).json({ error: "Not found" }); // 404, not 403: don't reveal other tenants' IDs
    res.json({ product: p });
  });

  r.post("/", (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    const d = parsed.data;
    try {
      const id = db
        .prepare(
          `INSERT INTO products (org_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold, last_updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(req.user.orgId, d.name, d.sku, d.description ?? null, d.quantity, d.cost_price ?? null, d.selling_price ?? null, d.low_stock_threshold ?? null, req.user.userId).lastInsertRowid;
      res.status(201).json({ product: db.prepare(`${SELECT} WHERE p.id = ? AND p.org_id = ?`).get(Number(id), req.user.orgId) });
    } catch (e) {
      if (isUniqueErr(e)) return res.status(409).json({ error: "A product with this SKU already exists" });
      throw e;
    }
  });

  r.put("/:id", (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    const d = parsed.data;
    try {
      const info = db
        .prepare(
          `UPDATE products SET name = ?, sku = ?, description = ?, quantity = ?, cost_price = ?, selling_price = ?,
             low_stock_threshold = ?, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND org_id = ?`
        )
        .run(d.name, d.sku, d.description ?? null, d.quantity, d.cost_price ?? null, d.selling_price ?? null, d.low_stock_threshold ?? null, req.user.userId, req.params.id, req.user.orgId);
      if (info.changes === 0) return res.status(404).json({ error: "Not found" });
      res.json({ product: db.prepare(`${SELECT} WHERE p.id = ? AND p.org_id = ?`).get(req.params.id, req.user.orgId) });
    } catch (e) {
      if (isUniqueErr(e)) return res.status(409).json({ error: "A product with this SKU already exists" });
      throw e;
    }
  });

  r.delete("/:id", (req, res) => {
    const info = db.prepare("DELETE FROM products WHERE id = ? AND org_id = ?").run(req.params.id, req.user.orgId);
    if (info.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // Atomic adjustment: no read-modify-write race, and never goes below zero.
  r.post("/:id/adjust", (req, res) => {
    const parsed = adjustSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    const { delta } = parsed.data;
    const info = db
      .prepare(
        `UPDATE products SET quantity = quantity + ?, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND org_id = ? AND quantity + ? >= 0`
      )
      .run(delta, req.user.userId, req.params.id, req.user.orgId, delta);
    if (info.changes === 0) {
      const exists = db.prepare("SELECT 1 FROM products WHERE id = ? AND org_id = ?").get(req.params.id, req.user.orgId);
      return exists
        ? res.status(400).json({ error: "Adjustment would make stock negative" })
        : res.status(404).json({ error: "Not found" });
    }
    res.json({ product: db.prepare(`${SELECT} WHERE p.id = ? AND p.org_id = ?`).get(req.params.id, req.user.orgId) });
  });

  return r;
}
