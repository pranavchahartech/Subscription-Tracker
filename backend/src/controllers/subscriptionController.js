const db = require('../models/db');

// Helper to determine subscription status
const getSubscriptionStatus = (sub) => {
  if (!sub.is_active) return 'Inactive';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If last_used_date is set, compare it. Otherwise compare start_date.
  const referenceDate = sub.last_used_date ? new Date(sub.last_used_date) : new Date(sub.start_date);
  referenceDate.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const isUnused = referenceDate < thirtyDaysAgo;

  const nextRenewal = new Date(sub.next_renewal);
  nextRenewal.setHours(0, 0, 0, 0);
  const diffTime = nextRenewal - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Review window is renewal in the next 7 days
  const isReview = diffDays >= 0 && diffDays <= 7;

  if (isUnused) return 'Unused';
  if (isReview) return 'Review';
  return 'Active';
};

const getSubscriptions = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY next_renewal ASC',
      [req.userId]
    );

    // Enrich subscriptions with dynamic status
    const subscriptions = result.rows.map(sub => ({
      ...sub,
      status: getSubscriptionStatus(sub)
    }));

    res.json(subscriptions);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ error: 'Server error while fetching subscriptions' });
  }
};

const createSubscription = async (req, res) => {
  const { name, cost, currency, billing_cycle, category, start_date, next_renewal, last_used_date, is_active } = req.body;

  if (!name || cost === undefined || !billing_cycle || !start_date || !next_renewal) {
    return res.status(400).json({ error: 'Missing required subscription fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO subscriptions 
        (user_id, name, cost, currency, billing_cycle, category, start_date, next_renewal, last_used_date, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        req.userId,
        name.trim(),
        parseFloat(cost),
        currency || 'INR',
        billing_cycle,
        category || 'Uncategorized',
        start_date,
        next_renewal,
        last_used_date || null,
        is_active !== undefined ? is_active : true
      ]
    );

    const sub = result.rows[0];
    res.status(201).json({
      ...sub,
      status: getSubscriptionStatus(sub)
    });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ error: 'Server error while creating subscription' });
  }
};

const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { name, cost, currency, billing_cycle, category, start_date, next_renewal, last_used_date, is_active } = req.body;

  if (!name || cost === undefined || !billing_cycle || !start_date || !next_renewal) {
    return res.status(400).json({ error: 'Missing required subscription fields' });
  }

  try {
    // Check ownership
    const checkOwnership = await db.query(
      'SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }

    const result = await db.query(
      `UPDATE subscriptions 
       SET name = $1, cost = $2, currency = $3, billing_cycle = $4, category = $5, start_date = $6, next_renewal = $7, last_used_date = $8, is_active = $9
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        name.trim(),
        parseFloat(cost),
        currency || 'INR',
        billing_cycle,
        category || 'Uncategorized',
        start_date,
        next_renewal,
        last_used_date || null,
        is_active !== undefined ? is_active : true,
        id,
        req.userId
      ]
    );

    const sub = result.rows[0];
    res.json({
      ...sub,
      status: getSubscriptionStatus(sub)
    });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: 'Server error while updating subscription' });
  }
};

const deleteSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }

    res.json({ message: 'Subscription deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    res.status(500).json({ error: 'Server error while deleting subscription' });
  }
};

const getSummary = async (req, res) => {
  try {
    // Fetch all active and inactive subscriptions to compile full statistics
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.userId]
    );

    let monthlyTotal = 0;
    let annualTotal = 0;
    let unusedCount = 0;
    let potentialSavingsMonthly = 0;
    let potentialSavingsAnnually = 0;

    const categoryMap = {};

    result.rows.forEach(sub => {
      if (!sub.is_active) return; // Only aggregate active subscriptions

      const cost = parseFloat(sub.cost);
      const isMonthly = sub.billing_cycle === 'monthly';
      const mCost = isMonthly ? cost : cost / 12;
      const aCost = isMonthly ? cost * 12 : cost;

      monthlyTotal += mCost;
      annualTotal += aCost;

      // Check if unused
      const status = getSubscriptionStatus(sub);
      if (status === 'Unused') {
        unusedCount++;
        potentialSavingsMonthly += mCost;
        potentialSavingsAnnually += aCost;
      }

      // Category breakdown
      const category = sub.category || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = { monthly: 0, annual: 0 };
      }
      categoryMap[category].monthly += mCost;
      categoryMap[category].annual += aCost;
    });

    const categoryBreakdown = Object.keys(categoryMap).map(category => ({
      category,
      monthlyCost: parseFloat(categoryMap[category].monthly.toFixed(2)),
      annualCost: parseFloat(categoryMap[category].annual.toFixed(2)),
      percentage: monthlyTotal > 0 
        ? parseFloat(((categoryMap[category].monthly / monthlyTotal) * 100).toFixed(2)) 
        : 0
    }));

    res.json({
      monthlyTotal: parseFloat(monthlyTotal.toFixed(2)),
      annualTotal: parseFloat(annualTotal.toFixed(2)),
      unusedCount,
      potentialSavingsMonthly: parseFloat(potentialSavingsMonthly.toFixed(2)),
      potentialSavingsAnnually: parseFloat(potentialSavingsAnnually.toFixed(2)),
      categoryBreakdown
    });
  } catch (err) {
    console.error('Error generating summary:', err);
    res.status(500).json({ error: 'Server error while generating summary' });
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSummary
};
