const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const { startWorker } = require('./queue/worker');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Queue a new notification event
app.post('/api/events', (req, res) => {
  const { eventType, channel, recipient, payload } = req.body;

  if (!eventType || !channel || !recipient) {
    return res.status(400).json({ error: "Missing required fields: eventType, channel, recipient" });
  }

  const query = `INSERT INTO notification_logs (event_type, channel, recipient, payload) VALUES (?, ?, ?, ?)`;
  db.run(query, [eventType, channel, recipient, JSON.stringify(payload || {})], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(202).json({ message: "Event queued successfully", jobId: this.lastID });
  });
});

// 2. Fetch live telemetry logs
app.get('/api/logs', (req, res) => {
  db.all(`SELECT * FROM notification_logs ORDER BY id DESC LIMIT 50`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. Fetch status breakdown for metrics cards
app.get('/api/metrics', (req, res) => {
  db.all(`SELECT status, COUNT(*) as count FROM notification_logs GROUP BY status`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 4. Re-queue a failed job from DLQ
app.post('/api/logs/:id/retry', (req, res) => {
  const { id } = req.params;
  db.run(
    `UPDATE notification_logs SET status = 'PENDING', attempts = 0, error_message = NULL WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Job re-queued successfully" });
    }
  );
});

const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Notification Engine API running on http://localhost:${PORT}`);
  startWorker();
});