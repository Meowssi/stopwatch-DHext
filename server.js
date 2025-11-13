const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4567;

// Persistent disk path on Render
const DB_PATH = "/data/stopwatch.json";

app.use(cors());
app.use(express.json());

// Ensure the file exists on first run
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "{}");
}

// Load timestamps from JSON file safely
let stopwatchData = {};
try {
  const fileContent = fs.readFileSync(DB_PATH, "utf8").trim();
  stopwatchData = fileContent ? JSON.parse(fileContent) : {};
} catch (err) {
  console.error("❌ Error reading stopwatch.json:", err);
  stopwatchData = {};
}

// Save timestamps to JSON file
function saveData() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(stopwatchData, null, 2));
  } catch (err) {
    console.error("❌ Failed to write stopwatch.json:", err);
  }
}

/* ============================================================
   RESET ROUTE — MUST COME BEFORE /:buttonLabel
   ============================================================ */
app.post("/resetAll", (req, res) => {
  try {
    stopwatchData = {}; // clear memory

    // Overwrite persistent file with empty object
    fs.writeFileSync(DB_PATH, "{}");

    res.json({ ok: true, message: "All timers reset to never clicked." });
  } catch (err) {
    console.error("❌ Reset failed:", err);
    res.status(500).json({ ok: false, error: "Reset failed." });
  }
});

/* ============================================================
   LOG BUTTON CLICK
   ============================================================ */
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

/* ============================================================
   GET ELAPSED TIME FOR A BUTTON
   ============================================================ */
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

/* ============================================================
   START SERVER
   ============================================================ */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
