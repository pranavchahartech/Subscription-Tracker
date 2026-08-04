import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import client from '../api/client';

// Mock Recharts ResponsiveContainer to prevent width/height 0 in jsdom
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
  };
});

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
  subscribeDemoMode: vi.fn(() => () => {}),
  subscribeApiError: vi.fn(() => () => {}),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', monthly_budget: 5000 },
    updateUserBudget: vi.fn(),
  }),
}));

const mockSummaryExceeded = {
  monthlyTotal: 6128,
  annualTotal: 73536,
  unusedCount: 1,
  potentialSavingsAnnually: 29400,
  monthlyBudget: 5000,
  categoryBreakdown: [{ category: 'Software', monthlyCost: 5150, annualCost: 61800 }],
  spendTrends: [{ month: 'Aug', spend: 6128, budget: 5000 }],
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders budget exceeded warning banner when monthly total exceeds cap', async () => {
    client.get.mockResolvedValueOnce({ data: mockSummaryExceeded });

    render(<Dashboard setCurrentPage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Budget Exceeded')).toBeInTheDocument();
      expect(screen.getByText('₹6,128')).toBeInTheDocument();
    });
  });

  it('renders stat cards correctly', async () => {
    client.get.mockResolvedValueOnce({ data: mockSummaryExceeded });

    render(<Dashboard setCurrentPage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Spend')).toBeInTheDocument();
      expect(screen.getByText('Projected Annual')).toBeInTheDocument();
      expect(screen.getByText('Idle Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Potential Savings')).toBeInTheDocument();
    });
  });
});
