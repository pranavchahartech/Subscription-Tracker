import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

// Mock State for Seamless Interactive Demo when local backend DB is offline
const today = new Date();
const formatDate = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

let mockUser = {
  id: 1,
  email: 'demo@subspace.io',
  monthly_budget: 5000.00,
};

let mockSubscriptions = [
  {
    id: 1,
    name: 'Netflix Premium 4K',
    cost: 649.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Entertainment',
    start_date: formatDate(-180),
    next_renewal: formatDate(3),
    last_used_date: formatDate(-1),
    is_active: true,
    status: 'Review',
  },
  {
    id: 2,
    name: 'Spotify Family Plan',
    cost: 179.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Entertainment',
    start_date: formatDate(-365),
    next_renewal: formatDate(18),
    last_used_date: formatDate(-2),
    is_active: true,
    status: 'Active',
  },
  {
    id: 3,
    name: 'AWS Cloud Hosting',
    cost: 2450.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Software',
    start_date: formatDate(-240),
    next_renewal: formatDate(12),
    last_used_date: formatDate(-38),
    is_active: true,
    status: 'Unused',
  },
  {
    id: 4,
    name: 'ChatGPT Plus (OpenAI)',
    cost: 1650.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Software',
    start_date: formatDate(-90),
    next_renewal: formatDate(5),
    last_used_date: formatDate(-1),
    is_active: true,
    status: 'Review',
  },
  {
    id: 5,
    name: 'Cult.fit Cultpass PRO',
    cost: 1200.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Health & Fitness',
    start_date: formatDate(-120),
    next_renewal: formatDate(22),
    last_used_date: formatDate(-3),
    is_active: true,
    status: 'Active',
  },
  {
    id: 6,
    name: 'Figma Professional',
    cost: 1050.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Software',
    start_date: formatDate(-300),
    next_renewal: formatDate(40),
    last_used_date: formatDate(-60),
    is_active: false,
    status: 'Inactive',
  },
];

const calculateSummary = () => {
  const activeSubs = mockSubscriptions.filter(s => s.is_active);
  
  let monthlyTotal = 0;
  let annualTotal = 0;
  let unusedCount = 0;
  let unusedMonthlyCost = 0;
  const categories = {};

  activeSubs.forEach(sub => {
    const cost = parseFloat(sub.cost);
    const mCost = sub.billing_cycle === 'annual' ? cost / 12 : cost;
    const aCost = sub.billing_cycle === 'annual' ? cost : cost * 12;

    monthlyTotal += mCost;
    annualTotal += aCost;

    if (sub.status === 'Unused') {
      unusedCount++;
      unusedMonthlyCost += mCost;
    }

    if (!categories[sub.category]) {
      categories[sub.category] = { category: sub.category, monthlyCost: 0, annualCost: 0 };
    }
    categories[sub.category].monthlyCost += mCost;
    categories[sub.category].annualCost += aCost;
  });

  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const spendTrends = months.map((month, idx) => ({
    month,
    spend: Math.round(monthlyTotal * (0.85 + (idx * 0.03))),
    budget: mockUser.monthly_budget,
  }));

  return {
    monthlyTotal: parseFloat(monthlyTotal.toFixed(2)),
    annualTotal: parseFloat(annualTotal.toFixed(2)),
    unusedCount,
    potentialSavingsAnnually: parseFloat((unusedMonthlyCost * 12).toFixed(2)),
    monthlyBudget: mockUser.monthly_budget,
    categoryBreakdown: Object.values(categories),
    spendTrends,
  };
};

// Response Interceptor for live API / Mock fallback
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend is not connected (Network Error or ECONNREFUSED)
    if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.response?.status >= 500) {
      const url = error.config?.url || '';
      const method = (error.config?.method || 'get').toLowerCase();

      // Auth me
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({ data: mockUser });
      }
      // Auth budget update
      if (url.includes('/api/auth/budget')) {
        const body = JSON.parse(error.config.data || '{}');
        mockUser.monthly_budget = body.monthly_budget;
        return Promise.resolve({ data: { message: 'Budget updated', user: mockUser } });
      }
      // Auth login / register
      if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
        const body = JSON.parse(error.config.data || '{}');
        if (body.email) mockUser.email = body.email;
        return Promise.resolve({ data: { message: 'Success', user: mockUser } });
      }
      // Subscriptions summary
      if (url.includes('/api/subscriptions/summary')) {
        return Promise.resolve({ data: calculateSummary() });
      }
      // Subscriptions list / export
      if (url.includes('/api/subscriptions') && method === 'get') {
        if (url.includes('/export/csv')) {
          const csvHeader = 'Name,Cost,Currency,Billing Cycle,Category,Next Renewal,Status\n';
          const csvRows = mockSubscriptions.map(s => `"${s.name}",${s.cost},${s.currency},${s.billing_cycle},"${s.category}",${s.next_renewal},${s.status}`).join('\n');
          return Promise.resolve({ data: csvHeader + csvRows, headers: { 'content-type': 'text/csv' } });
        }
        return Promise.resolve({ data: mockSubscriptions });
      }
      // Add subscription
      if (url.includes('/api/subscriptions') && method === 'post') {
        const body = JSON.parse(error.config.data || '{}');
        const newSub = {
          id: Date.now(),
          ...body,
          status: body.is_active ? 'Active' : 'Inactive',
        };
        mockSubscriptions.unshift(newSub);
        return Promise.resolve({ data: newSub });
      }
      // Update subscription
      if (url.includes('/api/subscriptions/') && method === 'put') {
        const id = parseInt(url.split('/').pop());
        const body = JSON.parse(error.config.data || '{}');
        mockSubscriptions = mockSubscriptions.map(s => s.id === id ? { ...s, ...body, status: body.is_active ? 'Active' : 'Inactive' } : s);
        const updated = mockSubscriptions.find(s => s.id === id);
        return Promise.resolve({ data: updated });
      }
      // Delete subscription
      if (url.includes('/api/subscriptions/') && method === 'delete') {
        const id = parseInt(url.split('/').pop());
        mockSubscriptions = mockSubscriptions.filter(s => s.id !== id);
        return Promise.resolve({ data: { message: 'Deleted successfully' } });
      }
    }

    return Promise.reject(error);
  }
);

export default client;
