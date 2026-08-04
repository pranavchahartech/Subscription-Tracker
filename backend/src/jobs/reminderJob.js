const cron = require('node-cron');
const db = require('../models/db');
const { sendMail } = require('../utils/mailer');
const logger = require('../utils/logger');

const startReminderJob = () => {
  // Runs every day at 08:00 server time
  cron.schedule('0 8 * * *', async () => {
    logger.info('ReminderJob: running daily renewal check');

    try {
      // Find all active subscriptions renewing in the next 7 days grouped by user
      const result = await db.query(`
        SELECT
          s.id, s.name, s.cost, s.currency, s.billing_cycle, s.next_renewal,
          u.email AS user_email
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.is_active = TRUE
          AND s.next_renewal BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ORDER BY u.email, s.next_renewal ASC
      `);

      if (result.rows.length === 0) {
        logger.info('ReminderJob: no upcoming renewals found today');
        return;
      }

      // Group subscriptions by user email
      const userMap = {};
      result.rows.forEach((row) => {
        if (!userMap[row.user_email]) {
          userMap[row.user_email] = [];
        }
        userMap[row.user_email].push(row);
      });

      // Send one email per user
      for (const [email, subs] of Object.entries(userMap)) {
        const rows = subs
          .map((s) => {
            const symbol = s.currency === 'INR' ? '₹' : s.currency;
            const renewal = new Date(s.next_renewal).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            });
            const cycle = s.billing_cycle === 'monthly' ? '/mo' : '/yr';
            return `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;color:#e2eaf5;font-weight:600;">${s.name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;color:#06b6d4;font-weight:700;">${symbol}${parseFloat(s.cost).toFixed(2)}${cycle}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;color:#f59e0b;">${renewal}</td>
            </tr>`;
          })
          .join('');

        const html = `
          <div style="font-family:'Segoe UI',sans-serif;background:#080c14;padding:32px;border-radius:16px;max-width:520px;margin:auto;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
              <div style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:10px;border-radius:12px;">
                <span style="font-size:20px;">💳</span>
              </div>
              <div>
                <h1 style="margin:0;font-size:20px;color:#e2eaf5;">SubSpace Renewal Alert</h1>
                <p style="margin:0;font-size:12px;color:#64748b;">Upcoming payments in the next 7 days</p>
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#0d1526;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#1e3a5f;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Subscription</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Amount</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Renewal Date</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="color:#475569;font-size:11px;margin-top:20px;text-align:center;">
              Manage your subscriptions at <a href="http://localhost:5173" style="color:#7c3aed;">SubSpace</a>
            </p>
          </div>
        `;

        sendMail({
          from: `"SubSpace Reminders" <${process.env.SMTP_USER || 'no-reply@subspace.com'}>`,
          to: email,
          subject: `⏰ ${subs.length} subscription${subs.length > 1 ? 's' : ''} renewing soon`,
          html,
        });

        logger.info({ email, count: subs.length }, 'ReminderJob: reminder sent');
      }
    } catch (err) {
      logger.error({ err }, 'ReminderJob: error during execution');
    }
  });

  logger.info('ReminderJob: scheduled (daily at 08:00)');
};

module.exports = { startReminderJob };
