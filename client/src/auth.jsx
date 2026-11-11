import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => setUser((await api.post("/auth/login", { email, password })).user);
  const signup = async (email, password, orgName) => setUser((await api.post("/auth/signup", { email, password, orgName })).user);
  const logout = async () => { await api.post("/auth/logout"); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}
