import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/dashboard").then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-gray-600">Products</p>
          <p className="mt-1 text-3xl font-semibold">{data.totalProducts}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-600">Units in stock</p>
          <p className="mt-1 text-3xl font-semibold">{data.totalUnits}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Low stock items</h2>
        {data.totalProducts === 0 ? (
          <div className="card p-6 text-sm text-gray-600">
            No products yet. <Link to="/products/new" className="font-medium text-pine-700 underline">Add your first product</Link> to start tracking stock.
          </div>
        ) : data.lowStock.length === 0 ? (
          <div className="card p-6 text-sm text-gray-600">Nothing is running low.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-600">
                <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 text-right font-medium">On hand</th><th className="px-4 py-3 text-right font-medium">Threshold</th></tr>
              </thead>
              <tbody>
                {data.lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3"><Link className="text-pine-700 hover:underline" to={`/products/${p.id}`}>{p.name}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-600">{p.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
