import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const money = (n) => (n == null ? "—" : `$${Number(n).toFixed(2)}`);

export default function Products() {
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(null); // product id
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    api.get(`/products?q=${encodeURIComponent(q)}`).then((d) => setProducts(d.products)).catch((e) => setError(e.message));
  }, [q]);

  // Debounced server-side search by name or SKU
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try { await api.del(`/products/${p.id}`); load(); } catch (e) { setError(e.message); }
  }

  async function adjust(e, p) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/products/${p.id}/adjust`, { delta: Number(delta), note });
      setAdjusting(null); setDelta(""); setNote(""); load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link to="/products/new" className="btn-primary">Add product</Link>
      </div>

      <input className="input max-w-sm" placeholder="Search by name or SKU" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <div className="error" role="alert">{error}</div>}

      {!products ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : products.length === 0 ? (
        <div className="card p-6 text-sm text-gray-600">
          {q ? "No products match your search." : <>No products yet. <Link to="/products/new" className="font-medium text-pine-700 underline">Add your first product</Link>.</>}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 align-top last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                  <td className="px-4 py-3 text-right">{p.quantity}</td>
                  <td className="px-4 py-3">
                    {p.is_low ? <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">Low stock</span> : <span className="text-xs text-gray-500">OK</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{money(p.selling_price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary !px-2 !py-1" onClick={() => setAdjusting(adjusting === p.id ? null : p.id)}>Adjust</button>
                      <Link className="btn-secondary !px-2 !py-1" to={`/products/${p.id}`}>Edit</Link>
                      <button className="btn-danger !px-2 !py-1" onClick={() => remove(p)}>Delete</button>
                    </div>
                    {adjusting === p.id && (
                      <form onSubmit={(e) => adjust(e, p)} className="mt-3 flex flex-wrap items-center justify-end gap-2">
                        <input type="number" step="1" required className="input !w-24" placeholder="+/- units" aria-label="Units to add or remove" value={delta} onChange={(e) => setDelta(e.target.value)} />
                        <input className="input !w-40" placeholder="Note (optional)" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
                        <button className="btn-primary !py-1.5">Apply</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
