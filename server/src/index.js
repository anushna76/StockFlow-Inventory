import "dotenv/config";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const db = openDb();
const app = createApp(db);
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`StockFlow API running on http://localhost:${port}`));
