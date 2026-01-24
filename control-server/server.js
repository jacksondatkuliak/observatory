const express = require("express");
const bodyParser = require("body-parser");
const Database = require("better-sqlite3");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

// --- Setup ---
var app = express();

// websocket
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  path: "/",
  cors: {
    origin: "http://localhost:3002",
  },
});

app.use(cors());

// Ensure DB directory exists
const dbDir = path.join(process.cwd(), "db");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// Connect to SQLite database
const dbPath = path.join(dbDir, "data.db");
const db = new Database(dbPath);

// Create temp/humidity table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL
  );
`);

// create roof log table
db.exec(`
  CREATE TABLE IF NOT EXISTS roof_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(bodyParser.json());

// --- Websocket ---

function cToF(temp) {
  return (temp * 9) / 5 + 32;
}

// inital values for dht11
const initValues = db
  .prepare(`SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1`)
  .all();
let latestTemperatureC = initValues["temperature"];
let latestTemperatureF = cToF(latestTemperatureC);
let latestHumiditiy = initValues["humidity"];

io.on("connection", (socket) => {
  console.log(socket.id + " connected");
  let dht11Data = { temp: latestTemperatureC, humidity: latestHumiditiy };
  socket.emit("dht11", dht11Data);
  const rows = db
    .prepare(`SELECT * FROM roof_log ORDER BY timestamp DESC LIMIT 1`)
    .all();
  socket.emit("roof", rows[0]);
});

// --- Routes ---

// POST endpoint for Raspberry Pi to send data
app.post("/dht11", (req, res) => {
  const { temperature, humidity } = req.body;

  if (typeof temperature !== "number" || typeof humidity !== "number") {
    return res
      .status(400)
      .json({ error: "Invalid or missing temperature/humidity" });
  }

  const stmt = db.prepare(
    "INSERT INTO readings (temperature, humidity) VALUES (?, ?)",
  );
  stmt.run(temperature, humidity);

  // update local global variables
  latestTemperatureC = temperature;
  latestTemperatureF = cToF(latestTemperatureC);
  latestHumiditiy = humidity;

  let dht11Data = { temp: latestTemperatureC, humidity: latestHumiditiy };
  io.emit("dht11", dht11Data);

  res.json({ status: "OK" });
});

// GET endpoint to retrieve recent readings
app.get("/dht11_readings/:readings", (req, res) => {
  const readings = req.params.readings || 1;
  const rows = db
    .prepare(`SELECT * FROM readings ORDER BY timestamp DESC LIMIT ${readings}`)
    .all();
  res.json(rows);
});

app.get("/dht11_5minavg", (req, res) => {
  const row = db
    .prepare(
      `
    SELECT 
      AVG(temperature) AS avg_temperature,
      AVG(humidity) AS avg_humidity
    FROM readings
    WHERE timestamp >= datetime('now', '-5 minutes')
  `,
    )
    .get();
  res.json(row);
});

// POST /roofupdate endpoint
app.post("/roofupdate", (req, res) => {
  try {
    const { roof } = req.body;

    if (!roof) {
      return res.status(400).json({ error: "Missing 'roof' field" });
    }

    const status = roof.toLowerCase();

    if (status !== "open" && status !== "closed") {
      return res
        .status(400)
        .json({ error: "Invalid roof value (must be 'open' or 'closed')" });
    }

    const insert = db.prepare("INSERT INTO roof_log (status) VALUES (?)");
    insert.run(status);

    const rows = db
      .prepare(`SELECT * FROM roof_log ORDER BY timestamp DESC LIMIT 1`)
      .all();
    io.emit("roof", rows[0]);

    console.log(`Roof status logged: ${status} at ${new Date().toISOString()}`);

    res.json({ message: "Roof status logged successfully", roof: status });
  } catch (err) {
    console.error("Error handling POST /roofstatus:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Optional: GET route to view latest logs
app.get("/roofhistory/:readings", (req, res) => {
  // req.params.readings is number of readings to get from database
  const readings = req.params.readings || 1; // default to 1 if no value passed
  const rows = db
    .prepare(`SELECT * FROM roof_log ORDER BY timestamp DESC LIMIT ${readings}`)
    .all();
  res.json(rows);
});

// --- Start server ---
app.listen(8080, "0.0.0.0", () => {
  console.log("http listening on port 8080");
});

httpServer.listen(3002, "0.0.0.0", () => {
  console.log("socket listening on port 3002");
});
