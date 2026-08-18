const nodemailer = require('nodemailer');

let transporter;
nodemailer.createTestAccount().then((account) => {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass }
  });
});

async function sendEmail(recipient, subject, body) {
  if (recipient.includes('fail')) throw new Error("504 Gateway Timeout - SMTP Provider Down");
  if (!transporter) throw new Error("Email transporter initializing...");
  const info = await transporter.sendMail({
    from: '"Notification Engine" <engine@system.com>',
    to: recipient,
    subject: subject,
    html: body
  });
  console.log(`[EMAIL SENT] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  return info;
}

async function sendWebhook(recipientUrl, payload) {
  if (recipientUrl.includes('fail')) throw new Error("500 Internal Server Error on Remote Endpoint");
  console.log(`[WEBHOOK SENT] Payload delivered to ${recipientUrl}`);
  return true;
}

async function sendSMS(phoneNumber, message) {
  if (phoneNumber.includes('fail')) throw new Error("402 Payment Required - SMS Gateway Quota Exceeded");
  console.log(`[SMS SENT] Message delivered to ${phoneNumber}: "${message}"`);
  return true;
}

module.exports = { sendEmail, sendWebhook, sendSMS };