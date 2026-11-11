import { DatabaseSync } from "node:sqlite";

export function openDb(path = process.env.DB_PATH || "./stockflow.db") {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS orgs (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      default_low_stock INTEGER NOT NULL DEFAULT 5
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES orgs(id),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES orgs(id),
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      cost_price REAL,
      selling_price REAL,
      low_stock_threshold INTEGER,
      last_updated_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (org_id, sku)
    );
    CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);
  `);
  return db;
}
