const { Pool } = require('pg');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

exports.handler = async (event) => {
  console.log('Starting daily subscription renewal reminder job...', event);

  const databaseUrl = process.env.DATABASE_URL;
  const awsRegion = process.env.AWS_REGION || 'ap-south-1';
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@yourdomain.com';

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is missing.');
    return { statusCode: 500, body: 'Database connection string missing' };
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const ses = new SESClient({ region: awsRegion });

  try {
    // Find all subscriptions active, renewing in next 7 days
    const queryText = `
      SELECT s.name, s.next_renewal, s.cost, s.currency, u.email
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.next_renewal BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND s.is_active = TRUE
    `;
    
    const { rows } = await pool.query(queryText);
    console.log(`Found ${rows.length} subscriptions renewing in the next 7 days.`);

    for (const sub of rows) {
      const formattedRenewal = new Date(sub.next_renewal).toLocaleDateString();
      const symbol = sub.currency === 'INR' ? '₹' : sub.currency;
      
      console.log(`Sending SES email reminder to ${sub.email} for ${sub.name}...`);
      
      const emailParams = {
        Source: fromEmail,
        Destination: { ToAddresses: [sub.email] },
        Message: {
          Subject: { 
            Data: `Reminder: ${sub.name} subscription renews on ${formattedRenewal}` 
          },
          Body: { 
            Text: { 
              Data: `Hello,\n\nThis is an automated reminder that your subscription to "${sub.name}" is scheduled to renew on ${formattedRenewal}.\n\nDetails:\n- Cost: ${symbol}${parseFloat(sub.cost).toFixed(2)}\n- Renewal Date: ${formattedRenewal}\n\nIf you no longer use this service, please cancel it before the renewal date to avoid extra charges.\n\nBest regards,\nSubSpace Tracker Team` 
            } 
          }
        }
      };

      try {
        await ses.send(new SendEmailCommand(emailParams));
        console.log(`Successfully emailed ${sub.email} for ${sub.name}`);
      } catch (emailErr) {
        console.error(`Failed to send email to ${sub.email} for ${sub.name}:`, emailErr);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully checked renewals. Processed ${rows.length} notifications.` })
    };
  } catch (err) {
    console.error('Error during reminder execution:', err);
    return { statusCode: 500, body: JSON.stringify(err) };
  } finally {
    await pool.end();
  }
};
