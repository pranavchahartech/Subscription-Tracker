const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.DATABASE_URL?.includes('render.com');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const bcrypt = require('bcryptjs');

const seedDb = async () => {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(res.rows[0].count, 10);
    if (count > 0) return;

    console.log('Seeding demo database...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['demo@subspace.com', passwordHash]
    );
    const userId = newUser.rows[0].id;

    const today = new Date();
    const getPastDate = (daysAgo) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };
    const getFutureDate = (daysAhead) => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const subscriptions = [
      // ── ACTIVE: used recently (2 days ago), renewal 20 days away ─────────────
      {
        name: 'Netflix Premium 4K',
        cost: 649.00, currency: 'INR', billing_cycle: 'monthly',
        category: 'Entertainment',
        start_date: getPastDate(30),
        next_renewal: getFutureDate(20),   // 20 days away  → not Review
        last_used_date: getPastDate(2),    // 2 days ago    → not Unused
        is_active: true,                   // → STATUS: ACTIVE ✅
      },
      // ── ACTIVE: everyday tool, renewal well ahead ────────────────────────────
      {
        name: 'AWS Cloud Hosting',
        cost: 2450.00, currency: 'INR', billing_cycle: 'monthly',
        category: 'Software',
        start_date: getPastDate(25),
        next_renewal: getFutureDate(25),   // 25 days away  → not Review
        last_used_date: getPastDate(1),    // yesterday     → not Unused
        is_active: true,                   // → STATUS: ACTIVE ✅
      },
      // ── REVIEW: renewing very soon (4 days), used recently ───────────────────
      {
        name: 'Airtel Fiber Broadband',
        cost: 943.00, currency: 'INR', billing_cycle: 'monthly',
        category: 'Utilities',
        start_date: getPastDate(28),
        next_renewal: getFutureDate(4),    // 4 days away   → within 7-day window
        last_used_date: getPastDate(3),    // 3 days ago    → not Unused
        is_active: true,                   // → STATUS: REVIEW ⚠️
      },
      // ── REVIEW: renewing in 2 days (will email reminder tonight) ─────────────
      {
        name: 'ChatGPT Plus',
        cost: 1650.00, currency: 'INR', billing_cycle: 'monthly',
        category: 'Software',
        start_date: getPastDate(28),
        next_renewal: getFutureDate(2),    // 2 days away   → within 7-day window
        last_used_date: getPastDate(1),    // yesterday     → not Unused
        is_active: true,                   // → STATUS: REVIEW ⚠️
      },
      // ── UNUSED: last used 40 days ago → idle for over a month ────────────────
      {
        name: 'Gold Gym Membership',
        cost: 9999.00, currency: 'INR', billing_cycle: 'annual',
        category: 'Health & Fitness',
        start_date: getPastDate(60),
        next_renewal: getFutureDate(305),  // annual, far away
        last_used_date: getPastDate(40),   // 40 days ago   → exceeds 30-day idle threshold
        is_active: true,                   // → STATUS: UNUSED 🟡
      },
      // ── INACTIVE: manually turned off by user ────────────────────────────────
      {
        name: 'Figma Professional',
        cost: 1050.00, currency: 'INR', billing_cycle: 'monthly',
        category: 'Software',
        start_date: getPastDate(20),
        next_renewal: getFutureDate(10),
        last_used_date: getPastDate(15),
        is_active: false,                  // → STATUS: INACTIVE 🔴
      },
    ];

    for (const sub of subscriptions) {
      await pool.query(
        `INSERT INTO subscriptions 
          (user_id, name, cost, currency, billing_cycle, category, start_date, next_renewal, last_used_date, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, sub.name, sub.cost, sub.currency, sub.billing_cycle, sub.category,
         sub.start_date, sub.next_renewal, sub.last_used_date, sub.is_active]
      );
    }
    console.log('Database auto-seeded successfully with demo@subspace.com / password123');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('Database tables verified/created successfully.');
    await seedDb();
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb
};
