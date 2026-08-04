const { getSubscriptionStatus } = require('../src/controllers/subscriptionController');

describe('Subscription Status Logic (getSubscriptionStatus)', () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getDateDaysAway = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  test('returns Inactive when is_active is false', () => {
    const sub = { is_active: false, next_renewal: getDateDaysAway(5) };
    expect(getSubscriptionStatus(sub)).toBe('Inactive');
  });

  test('returns Unused when last_used_date is more than 30 days ago', () => {
    const sub = {
      is_active: true,
      start_date: getDateDaysAway(-60),
      last_used_date: getDateDaysAway(-35),
      next_renewal: getDateDaysAway(20),
    };
    expect(getSubscriptionStatus(sub)).toBe('Unused');
  });

  test('returns Review when renewal is within 7 days', () => {
    const sub = {
      is_active: true,
      start_date: getDateDaysAway(-10),
      last_used_date: getDateDaysAway(-2),
      next_renewal: getDateDaysAway(4),
    };
    expect(getSubscriptionStatus(sub)).toBe('Review');
  });

  test('returns Active when sub is active, used recently, and renewal is > 7 days away', () => {
    const sub = {
      is_active: true,
      start_date: getDateDaysAway(-10),
      last_used_date: getDateDaysAway(-2),
      next_renewal: getDateDaysAway(15),
    };
    expect(getSubscriptionStatus(sub)).toBe('Active');
  });
});
