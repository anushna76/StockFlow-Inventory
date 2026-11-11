import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Settings() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get("/settings").then((d) => setValue(String(d.settings.default_low_stock))).catch((e) => setError(e.message)); }, []);

  async function submit(e) {
    e.preventDefault();
    setError(""); setSaved(false);
    try {
      const d = await api.put("/settings", { default_low_stock: value });
      setValue(String(d.settings.default_low_stock));
      setSaved(true);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form onSubmit={submit} className="card space-y-4 p-6">
        {error && <div className="error" role="alert">{error}</div>}
        {saved && <div className="rounded border border-pine-600/30 bg-pine-50 px-3 py-2 text-sm text-pine-700" role="status">Settings saved.</div>}
        <div>
          <label className="label" htmlFor="threshold">Default low stock threshold</label>
          <input id="threshold" type="number" min="0" step="1" required className="input" value={value} onChange={(e) => setValue(e.target.value)} />
          <p className="mt-1 text-xs text-gray-500">Used for products that don't have their own threshold. A product is low on stock when its quantity is at or below this number.</p>
        </div>
        <button className="btn-primary">Save settings</button>
      </form>
    </div>
  );
}
