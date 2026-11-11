import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";

const link = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? "bg-pine-50 text-pine-700" : "text-gray-600 hover:text-ink"}`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <span className="mr-4 text-lg font-semibold text-pine-700">StockFlow</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={link}>Dashboard</NavLink>
            <NavLink to="/products" className={link}>Products</NavLink>
            <NavLink to="/settings" className={link}>Settings</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-gray-500 sm:inline">{user.orgName}</span>
            <button className="btn-secondary !py-1" onClick={async () => { await logout(); navigate("/login"); }}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
