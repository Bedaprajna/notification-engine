const db = require('../db/database');
const adapters = require('../adapters');
const handlebars = require('handlebars');

const templates = {
  ORDER_PLACED: handlebars.compile("<h2>Order #{{orderId}} Confirmed!</h2><p>Total: {{amount}}</p>"),
  PASSWORD_RESET: handlebars.compile("<p>Click <a href='{{resetLink}}'>here</a> to reset your password.</p>")
};

async function processPendingJobs() {
  db.all(
    `SELECT * FROM notification_logs WHERE status = 'PENDING' AND attempts < max_attempts LIMIT 5`,
    async (err, rows) => {
      if (err || !rows || rows.length === 0) return;

      for (const job of rows) {
        const payload = JSON.parse(job.payload);
        const nextAttempts = job.attempts + 1;

        db.run(`UPDATE notification_logs SET status = 'PROCESSING', attempts = ? WHERE id = ?`, [nextAttempts, job.id]);

        try {
          const renderedContent = templates[job.event_type] 
            ? templates[job.event_type](payload) 
            : `Notification: ${JSON.stringify(payload)}`;

          if (job.channel === 'EMAIL') {
            await adapters.sendEmail(job.recipient, `Update: ${job.event_type}`, renderedContent);
          } else if (job.channel === 'WEBHOOK') {
            await adapters.sendWebhook(job.recipient, payload);
          } else if (job.channel === 'SMS') {
            await adapters.sendSMS(job.recipient, renderedContent);
          }

          db.run(`UPDATE notification_logs SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [job.id]);
        } catch (error) {
          if (nextAttempts >= job.max_attempts) {
            db.run(`UPDATE notification_logs SET status = 'FAILED_DLQ', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [error.message, job.id]);
          } else {
            db.run(`UPDATE notification_logs SET status = 'PENDING', error_message = ? WHERE id = ?`, [error.message, job.id]);
          }
        }
      }
    }
  );
}

function startWorker() {
  setInterval(processPendingJobs, 3000);
  console.log("Queue Worker polling every 3000ms...");
}

module.exports = { startWorker };