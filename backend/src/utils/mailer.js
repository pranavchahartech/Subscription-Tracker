const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Send an email. Falls back to console logging in dev if SMTP fails.
 * @param {object} options - nodemailer mailOptions
 */
const sendMail = (options) => {
  transporter.sendMail(options, (error, info) => {
    if (error) {
      logger.error({ err: error }, 'Mailer: send error');
      if (process.env.NODE_ENV !== 'production') {
        logger.info({ to: options.to, subject: options.subject }, '[DEV] Email would have been sent');
      }
    } else {
      logger.info({ messageId: info.messageId, response: info.response }, 'Mailer: email sent');
    }
  });
};

module.exports = { sendMail, transporter };
