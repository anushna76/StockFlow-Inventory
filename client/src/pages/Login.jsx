import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import AuthShell from "./AuthShell.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try { await login(form.email, form.password); navigate("/"); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="Log in to your inventory" footer={<>New here? <Link className="font-medium text-pine-700 underline" to="/signup">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="error" role="alert">{error}</div>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
    </AuthShell>
  );
}
