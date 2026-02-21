/**
 * Notification service (Phase 7). Email stub — set SMTP in env to enable.
 */
const config = require('../config');

async function sendApplicationStatusChange(applicantEmail, applicantName, positionTitle, newStatus) {
  const message = `Your application for "${positionTitle}" is now: ${newStatus}.`;
  if (config.sendgridApiKey || config.smtpHost) {
    // TODO: integrate SendGrid or nodemailer when env is set
    console.log('[Notification]', applicantEmail, message);
    return;
  }
  console.log('[Notification stub]', applicantEmail, message);
}

module.exports = { sendApplicationStatusChange };
