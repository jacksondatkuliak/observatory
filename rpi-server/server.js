// server/server.js
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs"); // allows us to access filesystem

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/rooftoggle", (req, res) => {
  exec(`python /home/jackson/roof/rooftoggle.py`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    console.log(`stdout: ${stdout}`);
    res.json({ output: stdout });
  });
});

app.post("/testscript", (req, res) => {
  exec(`python /home/jackson/roof/test.py`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }

    console.log(`stdout: ${stdout}`);
    res.json({ output: stdout });
  });
});

app.get("/roofstatus", (req, res) => {
  const filePath = "/home/jackson/roof/roofstatus";

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      return res.status(500).json({ error: "Could not read status file." });
    }

    res.json({ status: data.trim() }); // send the file contents
  });
})

app.get("/rooflog", (req, res) => {
  const filePath = "/home/jackson/roof/rooflog";

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      return res.status(500).json({ error: "Could not read log file." });
    }

    res.json({ log: data.trim() }); // send the file contents
  });
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
