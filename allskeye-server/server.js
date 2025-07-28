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
    origin: "http://localhost:5173",
  },
});

httpServer.listen(3002, () =>
  console.log("listening on http://localhost:3002/")
);

app.use(cors());
app.use(express.json());

// Watch for changes to the image file
fs.watchFile(config.latestImagePath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    fs.readFile(config.latestImagePath, (err, data) => {
      if (err) {
        console.error("Failed to read image:", err);
        return;
      }

      try {
        io.emit("new_image", data); // Send the raw Buffer
      } catch (emitErr) {
        console.error("Failed to emit image over WebSocket:", emitErr.message);
      }
    });
  }
});

io.on("connection", (socket) => {
  console.log(socket.id + " connected");
  sendImage();
});

app.listen(3001, () => {
  console.log(`Server is running on port ${3001}`);
});

function sendImage() {
  fs.readFile(config.latestImagePath, (err, data) => {
    if (err) {
      console.error("Failed to read image:", err);
      return;
    }

    try {
      io.emit("new_image", data); // Send the raw Buffer
    } catch (emitErr) {
      console.error("Failed to emit image over WebSocket:", emitErr.message);
    }
  });
}
