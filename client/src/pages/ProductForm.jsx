import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

const empty = { name: "", sku: "", description: "", quantity: "0", cost_price: "", selling_price: "", low_stock_threshold: "" };
const str = (v) => (v == null ? "" : String(v));

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!editing) return;
    api.get(`/products/${id}`)
      .then(({ product: p }) => setForm({
        name: p.name, sku: p.sku, description: str(p.description), quantity: str(p.quantity),
        cost_price: str(p.cost_price), selling_price: str(p.selling_price), low_stock_threshold: str(p.low_stock_threshold),
      }))
      .catch((e) => setError(e.status === 404 ? "This product doesn't exist." : e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      // Empty optional fields are sent as "" and the server stores them as null.
      if (editing) await api.put(`/products/${id}`, form);
      else await api.post("/products", form);
      navigate("/products");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{editing ? "Edit product" : "Add product"}</h1>
      <form onSubmit={submit} className="card space-y-4 p-6">
        {error && <div className="error" role="alert">{error}</div>}
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" required className="input" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label" htmlFor="sku">SKU</label>
          <input id="sku" required className="input" value={form.sku} onChange={set("sku")} />
        </div>
        <div>
          <label className="label" htmlFor="description">Description <span className="font-normal text-gray-500">(optional)</span></label>
          <textarea id="description" rows={3} className="input" value={form.description} onChange={set("description")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="quantity">Quantity on hand</label>
            <input id="quantity" type="number" min="0" step="1" required className="input" value={form.quantity} onChange={set("quantity")} />
          </div>
          <div>
            <label className="label" htmlFor="threshold">Low stock threshold</label>
            <input id="threshold" type="number" min="0" step="1" className="input" placeholder="Use default" value={form.low_stock_threshold} onChange={set("low_stock_threshold")} />
          </div>
          <div>
            <label className="label" htmlFor="cost">Cost price</label>
            <input id="cost" type="number" min="0" step="0.01" className="input" value={form.cost_price} onChange={set("cost_price")} />
          </div>
          <div>
            <label className="label" htmlFor="price">Selling price</label>
            <input id="price" type="number" min="0" step="0.01" className="input" value={form.selling_price} onChange={set("selling_price")} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>
          <Link to="/products" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
