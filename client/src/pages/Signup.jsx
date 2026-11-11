import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import AuthShell from "./AuthShell.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ orgName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try { await signup(form.email, form.password, form.orgName); navigate("/"); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="Create your account" footer={<>Already registered? <Link className="font-medium text-pine-700 underline" to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="error" role="alert">{error}</div>}
        <div>
          <label className="label" htmlFor="org">Organization name</label>
          <input id="org" required className="input" placeholder="My Test Store" value={form.orgName} onChange={set("orgName")} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={8} className="input" value={form.password} onChange={set("password")} />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" required className="input" value={form.confirm} onChange={set("confirm")} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
