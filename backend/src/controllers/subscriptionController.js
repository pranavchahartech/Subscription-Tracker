const db = require('../models/db');
const logger = require('../utils/logger');

// Helper to determine subscription status
const getSubscriptionStatus = (sub) => {
  if (!sub.is_active) return 'Inactive';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const referenceDate = sub.last_used_date ? new Date(sub.last_used_date) : new Date(sub.start_date);
  referenceDate.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const isUnused = referenceDate < thirtyDaysAgo;

  const nextRenewal = new Date(sub.next_renewal);
  nextRenewal.setHours(0, 0, 0, 0);
  const diffTime = nextRenewal - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isReview = diffDays >= 0 && diffDays <= 7;

  if (isUnused) return 'Unused';
  if (isReview) return 'Review';
  return 'Active';
};

const getSubscriptions = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND deleted_at IS NULL ORDER BY next_renewal ASC',
      [req.userId]
    );

    const subscriptions = result.rows.map(sub => ({
      ...sub,
      cost: parseFloat(sub.cost),
      status: getSubscriptionStatus(sub)
    }));

    res.json(subscriptions);
  } catch (err) {
    logger.error({ err }, 'Error fetching subscriptions');
    res.status(500).json({ error: 'Server error while fetching subscriptions' });
  }
};

const createSubscription = async (req, res) => {
  const { name, cost, currency, billing_cycle, category, start_date, next_renewal, last_used_date, is_active } = req.body;

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
        category || 'Other',
        start_date,
        next_renewal,
        last_used_date || null,
        is_active !== undefined ? is_active : true
      ]
    );

    const sub = result.rows[0];
    res.status(201).json({
      ...sub,
      cost: parseFloat(sub.cost),
      status: getSubscriptionStatus(sub)
    });
  } catch (err) {
    logger.error({ err }, 'Error creating subscription');
    res.status(500).json({ error: 'Server error while creating subscription' });
  }
};

const updateSubscription = async (req, res) => {
  const { id } = req.params;
  const { name, cost, currency, billing_cycle, category, start_date, next_renewal, last_used_date, is_active } = req.body;

  try {
    const checkOwnership = await db.query(
      'SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, req.userId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }

    const result = await db.query(
      `UPDATE subscriptions 
       SET name = $1, cost = $2, currency = $3, billing_cycle = $4, category = $5, start_date = $6, next_renewal = $7, last_used_date = $8, is_active = $9
       WHERE id = $10 AND user_id = $11 AND deleted_at IS NULL
       RETURNING *`,
      [
        name.trim(),
        parseFloat(cost),
        currency || 'INR',
        billing_cycle,
        category || 'Other',
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
      cost: parseFloat(sub.cost),
      status: getSubscriptionStatus(sub)
    });
  } catch (err) {
    logger.error({ err }, 'Error updating subscription');
    res.status(500).json({ error: 'Server error while updating subscription' });
  }
};

const deleteSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    // Soft delete by setting deleted_at timestamp
    const result = await db.query(
      'UPDATE subscriptions SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }

    res.json({ message: 'Subscription deleted successfully (soft-deleted)', id: result.rows[0].id });
  } catch (err) {
    logger.error({ err }, 'Error deleting subscription');
    res.status(500).json({ error: 'Server error while deleting subscription' });
  }
};

const getSummary = async (req, res) => {
  try {
    // Fetch active user subscriptions (not soft-deleted)
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND deleted_at IS NULL',
      [req.userId]
    );

    // Fetch user monthly budget
    const userResult = await db.query(
      'SELECT monthly_budget FROM users WHERE id = $1',
      [req.userId]
    );
    const monthlyBudget = userResult.rows.length > 0 ? parseFloat(userResult.rows[0].monthly_budget) : 0;

    let monthlyTotal = 0;
    let annualTotal = 0;
    let unusedCount = 0;
    let reviewCount = 0;
    let potentialSavingsMonthly = 0;
    let potentialSavingsAnnually = 0;

    const categoryMap = {};

    result.rows.forEach(sub => {
      if (!sub.is_active) return;

      const cost = parseFloat(sub.cost);
      const isMonthly = sub.billing_cycle === 'monthly';
      const mCost = isMonthly ? cost : cost / 12;
      const aCost = isMonthly ? cost * 12 : cost;

      monthlyTotal += mCost;
      annualTotal += aCost;

      const status = getSubscriptionStatus(sub);
      if (status === 'Unused') {
        unusedCount++;
        potentialSavingsMonthly += mCost;
        potentialSavingsAnnually += aCost;
      } else if (status === 'Review') {
        reviewCount++;
      }

      const category = sub.category || 'Other';
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

    // Generate 6-Month Spend Trend Data
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      
      // Calculate active monthly spend for that month based on subscription start dates
      let historicalSpend = 0;
      result.rows.forEach(sub => {
        if (!sub.is_active) return;
        const startDate = new Date(sub.start_date);
        if (startDate <= new Date(d.getFullYear(), d.getMonth() + 1, 0)) {
          const cost = parseFloat(sub.cost);
          historicalSpend += sub.billing_cycle === 'monthly' ? cost : cost / 12;
        }
      });

      months.push({
        month: monthLabel,
        spend: parseFloat(historicalSpend.toFixed(2)),
        budget: monthlyBudget
      });
    }

    res.json({
      monthlyTotal: parseFloat(monthlyTotal.toFixed(2)),
      annualTotal: parseFloat(annualTotal.toFixed(2)),
      monthlyBudget,
      budgetExceeded: monthlyBudget > 0 && monthlyTotal > monthlyBudget,
      unusedCount,
      reviewCount,
      potentialSavingsMonthly: parseFloat(potentialSavingsMonthly.toFixed(2)),
      potentialSavingsAnnually: parseFloat(potentialSavingsAnnually.toFixed(2)),
      categoryBreakdown,
      spendTrends: months
    });
  } catch (err) {
    logger.error({ err }, 'Error generating summary');
    res.status(500).json({ error: 'Server error while generating summary' });
  }
};

const exportCsv = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND deleted_at IS NULL ORDER BY next_renewal ASC',
      [req.userId]
    );
    // PostgreSQL DATE columns come back as JS Date objects — convert safely
    const toDateStr = (val) => {
      if (!val) return '';
      if (val instanceof Date) return val.toISOString().split('T')[0];
      return String(val).split('T')[0];
    };
    const headers = ['Name','Cost','Currency','Billing Cycle','Category','Start Date','Next Renewal','Last Used','Active','Status'];
    const rows = result.rows.map(sub => [
      `"${sub.name.replace(/"/g,'""')}"`,
      parseFloat(sub.cost).toFixed(2),
      sub.currency,
      sub.billing_cycle,
      sub.category,
      toDateStr(sub.start_date),
      toDateStr(sub.next_renewal),
      toDateStr(sub.last_used_date),
      sub.is_active ? 'Yes' : 'No',
      getSubscriptionStatus(sub)
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subspace-subscriptions.csv"');
    res.send(csv);
  } catch (err) {
    logger.error({ err }, 'Error exporting CSV');
    res.status(500).json({ error: 'Server error while exporting CSV' });
  }
};


module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSummary,
  exportCsv,
  getSubscriptionStatus
};
