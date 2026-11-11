import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signToken, setAuthCookie, requireAuth } from "../auth.js";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().trim().min(1, "Organization name is required").max(100),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export default function authRoutes(db) {
  const r = Router();

  r.post("/signup", (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { email, password, orgName } = parsed.data;

    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email))
      return res.status(409).json({ error: "An account with this email already exists" });

    const hash = bcrypt.hashSync(password, 10);
    const create = () => {
      db.exec("BEGIN");
      try {
        const orgId = db.prepare("INSERT INTO orgs (name) VALUES (?)").run(orgName).lastInsertRowid;
        const userId = db
          .prepare("INSERT INTO users (org_id, email, password_hash) VALUES (?, ?, ?)")
          .run(orgId, email, hash).lastInsertRowid;
        db.exec("COMMIT");
        return { orgId: Number(orgId), userId: Number(userId) };
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    };
    const { orgId, userId } = create();
    setAuthCookie(res, signToken({ userId, orgId }));
    res.status(201).json({ user: { id: userId, email, orgId, orgName } });
  });

  r.post("/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter your email and password" });
    const { email, password } = parsed.data;
    const u = db
      .prepare("SELECT u.id, u.org_id, u.password_hash, o.name AS org_name FROM users u JOIN orgs o ON o.id = u.org_id WHERE u.email = ?")
      .get(email);
    if (!u || !bcrypt.compareSync(password, u.password_hash))
      return res.status(401).json({ error: "Incorrect email or password" });
    setAuthCookie(res, signToken({ userId: u.id, orgId: u.org_id }));
    res.json({ user: { id: u.id, email, orgId: u.org_id, orgName: u.org_name } });
  });

  r.post("/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ ok: true });
  });

  r.get("/me", requireAuth, (req, res) => {
    const u = db
      .prepare("SELECT u.id, u.email, u.org_id, o.name AS org_name FROM users u JOIN orgs o ON o.id = u.org_id WHERE u.id = ? AND u.org_id = ?")
      .get(req.user.userId, req.user.orgId);
    if (!u) return res.status(401).json({ error: "Unauthorized" });
    res.json({ user: { id: u.id, email: u.email, orgId: u.org_id, orgName: u.org_name } });
  });

  return r;
}
