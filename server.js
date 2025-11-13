const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4567;

const DB_PATH = path.join("/data", "stopwatch.json");

app.use(cors());
app.use(express.json());

// Load timestamps from JSON file
let stopwatchData = {};
if (fs.existsSync(DB_PATH)) {
  try {
    stopwatchData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch (err) {
    console.error("❌ Error reading stopwatch.json:", err);
    stopwatchData = {};
  }
}

// Save timestamps to JSON file
function saveData() {
  fs.writeFileSync(DB_PATH, JSON.stringify(stopwatchData, null, 2));
}

// POST endpoint to log a click
app.post("/:buttonLabel", (req, res) => {
  const { buttonLabel } = req.params;
  const { timestamp } = req.body;

  if (!buttonLabel || !timestamp) {
    return res.status(400).json({ error: "Missing data." });
  }

  stopwatchData[buttonLabel] = timestamp;
  saveData();
  res.json({ success: true });
});

// GET endpoint to return elapsed time
app.get("/getElapsed", (req, res) => {
  const { buttonLabel } = req.query;

  if (!buttonLabel || !stopwatchData[buttonLabel]) {
    return res.json({
      elapsedText: "Never clicked yet.",
      timestamp: null,
    });
  }

  const timestamp = stopwatchData[buttonLabel];
  const elapsedMs = Date.now() - timestamp;
  const seconds = Math.floor(elapsedMs / 1000) % 60;
  const minutes = Math.floor(elapsedMs / (1000 * 60)) % 60;
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60));

  const elapsedText = `${hours}h ${minutes}m ${seconds}s since last click.`;
  res.json({ elapsedText, timestamp });
});

app.post("/resetAll", (req, res) => {
  try {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);   // 🔥 DELETE the file instead of writing to it
    }

    stopwatchData = {};         // clear in-memory store
    saveData();                 // recreate empty file safely

    res.json({ ok: true, cleared: true });
  } catch (err) {
    console.error("❌ Reset failed:", err);
    res.status(500).json({ ok: false, error: "Reset failed." });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
