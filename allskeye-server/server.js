const path = require("path");
const cors = require("cors");
const fs = require("fs");
const config = require("./config.json");

const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  path: "/",
  cors: {
    origin: "http://localhost:3002",
  },
});

app.use(cors());
app.use(express.json());

// Watch for changes to the image file
fs.watchFile(config.latestImagePath, { interval: 5000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    sendImage();
  }
});

// modifiable json object for esp32 data
let esp32_data = {
  temp: null,
  humidity: null,
  dewpoint: null,
  fan: null,
  dew: null,
  wait_time: null,
  toggle_wait_time: null,
  cooling_fan_threshold: null,
  cooling_fan_abs_threshold: null,
  dew_heater_threshold: null,
  dew_heater_abs_threshold: null,
  mode: null,
};

// endpoint to bounce update requests to esp32
app.get("/update", async (req, res) => {
  const { output, state } = req.query;
  if (output == null || state == null) {
    res.status(400).json({ message: "Expected output and query parameters!" });
    return;
  }
  // make request to esp32
  try {
    const espRes = await fetch(
      `http://${config.esp32_ip}/update?output=${encodeURIComponent(
        output,
      )}&state=${encodeURIComponent(state)}`,
      { timeout: 10000 },
    );

    const contentType = espRes.headers.get("content-type") || "text/plain";
    const body = await espRes.text();

    // respond with same http response as esp32
    res.status(espRes.status).type(contentType).send(body);
  } catch (err) {
    console.error("ESP32 update failed:", err.message);
    res.status(400).json({
      message: "Failed to reach ESP32",
    });
  } finally {
    pollESP32();
  }
});

// endpoint to immediatly poll an emit esp32 state
app.get("/pollnow", (req, res) => {
  pollESP32();
  res.sendStatus(200);
});

io.on("connection", (socket) => {
  console.log(socket.id + " connected");
  // send allsky image
  sendImage();
  // send current esp32 data
  sendESP32();
});

function sendImage() {
  fs.readFile(config.latestImagePath, (err, data) => {
    if (err) {
      console.error("Failed to read image:", err);
      return;
    }

    try {
      io.emit("new_image", data);
    } catch (emitErr) {
      console.error("Failed to emit image over WebSocket:", emitErr.message);
    }
  });
}

function sendESP32() {
  try {
    io.emit("esp32_data", esp32_data);
  } catch (emitErr) {
    console.error("Failed to emit ESP32 data over WebSocket:", emitErr.message);
  }
}

let pollingInProgress = false;

async function pollESP32() {
  // prevent double poll
  if (pollingInProgress) return;
  pollingInProgress = true;
  try {
    const res = await fetch(`http://${config.esp32_ip}/status?var=all`, {
      timeout: 10000,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid ESP32 data");
    }

    for (const key of Object.keys(data)) {
      if (key in esp32_data) {
        esp32_data[key] = data[key];
      } else {
        console.log("Invalid key in response: ", key);
      }
    }

    esp32_data.last_update = Date.now();

    // send esp32 data over websocket
    sendESP32();
  } catch (err) {
    console.error("ESP32 poll failed:", err.message);
  } finally {
    pollingInProgress = false;
  }
}

function startESP32Polling() {
  async function run() {
    await pollESP32();
    setTimeout(run, 60000);
  }

  run(); // run immediately
}

startESP32Polling();

app.listen(3001, "0.0.0.0", () => {
  console.log("http listening on port 3001");
});

httpServer.listen(3002, "0.0.0.0", () => {
  console.log("socket listening on port 3002");
});
