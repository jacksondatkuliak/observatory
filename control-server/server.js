import express from "express";
import bodyParser from "body-parser";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// --- Setup ---
const app = express();
const PORT = 8080;

// Ensure DB directory exists
const dbDir = path.join(process.cwd(), "db");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// Connect to SQLite database
const dbPath = path.join(dbDir, "data.db");
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL
  );
`);

app.use(bodyParser.json());

// --- Routes ---

// POST endpoint for Raspberry Pi to send data
app.post("/dht11", (req, res) => {
  const { temperature, humidity } = req.body;

  if (typeof temperature !== "number" || typeof humidity !== "number") {
    return res.status(400).json({ error: "Invalid or missing temperature/humidity" });
  }

  const stmt = db.prepare("INSERT INTO readings (temperature, humidity) VALUES (?, ?)");
  stmt.run(temperature, humidity);

  res.json({ status: "OK" });
});

// GET endpoint to retrieve recent readings
app.get("/dht11_readings", (req, res) => {
  const limit = parseInt(req.query.limit || "50"); // default 50 latest readings
  const stmt = db.prepare("SELECT * FROM readings ORDER BY timestamp DESC LIMIT ?");
  const rows = stmt.all(limit);
  res.json(rows);
});

// GET endpoint for a summarized average (optional)
/*app.get("/summary", (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as count,
      AVG(temperature) as avg_temp,
      AVG(humidity) as avg_humidity
    FROM readings;
  `);
  const summary = stmt.get();
  res.json(summary);
});*/

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
