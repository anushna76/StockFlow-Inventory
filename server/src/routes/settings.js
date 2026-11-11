import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";

const schema = z.object({
  default_low_stock: z.coerce.number({ invalid_type_error: "Enter a number" }).int("Enter a whole number").min(0, "Cannot be negative").max(1_000_000),
});

export default function settingsRoutes(db) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", (req, res) => {
    const org = db.prepare("SELECT name, default_low_stock FROM orgs WHERE id = ?").get(req.user.orgId);
    res.json({ settings: org });
  });

  r.put("/", (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    db.prepare("UPDATE orgs SET default_low_stock = ? WHERE id = ?").run(parsed.data.default_low_stock, req.user.orgId);
    res.json({ settings: db.prepare("SELECT name, default_low_stock FROM orgs WHERE id = ?").get(req.user.orgId) });
  });

  return r;
}
