import { Router } from "express";
import { requireAuth } from "../auth.js";

export default function dashboardRoutes(db) {
  const r = Router();
  r.use(requireAuth);

  r.get("/", (req, res) => {
    const { orgId } = req.user;
    const org = db.prepare("SELECT default_low_stock FROM orgs WHERE id = ?").get(orgId);
    const totals = db
      .prepare("SELECT COUNT(*) AS products, COALESCE(SUM(quantity), 0) AS units FROM products WHERE org_id = ?")
      .get(orgId);
    const lowStock = db
      .prepare(
        `SELECT id, name, sku, quantity, COALESCE(low_stock_threshold, ?) AS threshold
         FROM products
         WHERE org_id = ? AND quantity <= COALESCE(low_stock_threshold, ?)
         ORDER BY quantity ASC, name ASC`
      )
      .all(org.default_low_stock, orgId, org.default_low_stock);
    res.json({ totalProducts: totals.products, totalUnits: totals.units, lowStock });
  });

  return r;
}
