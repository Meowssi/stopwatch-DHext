const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4567;

// ⬅️ Store DB inside project folder (always writable on Render)
const DB_PATH = path.join(__dirname, "stopwatch.json");

app.use(cors());
app.use(express.json());

// Load timestamps from JSON file
let stopwatchData = {};
if (fs.existsSync(DB_PATH)) {
  try {
    stopwatchData = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (err) {
    console.error("❌ Error reading stopwatch.json:", err);
    stopwatchData = {};
  }
}

// Save timestamps to JSON file
function saveData() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(stopwatchData, null, 2));
  } catch (err) {
    console.error("❌ Failed to write file:", err);
  }
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

// ⬅️ NEW reset route that actually works on Render
app.post("/resetAll", (req, res) => {
  try {
    stopwatchData = {};

    // Overwrite file with {}
    fs.writeFileSync(DB_PATH, "{}");

    res.json({ ok: true, message: "All timers reset to never clicked" });
  } catch (err) {
    console.error("❌ Reset failed:", err);
    res.status(500).json({ ok: false, error: "Reset failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
