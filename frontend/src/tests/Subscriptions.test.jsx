import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Subscriptions from '../pages/Subscriptions';
import client from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  subscribeDemoMode: vi.fn(() => () => {}),
  subscribeApiError: vi.fn(() => () => {}),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'test@example.com' } }),
}));

const mockSubscriptions = [
  {
    id: 1,
    name: 'Netflix Premium',
    cost: 649,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Entertainment',
    start_date: '2026-01-01',
    next_renewal: '2026-08-15',
    is_active: true,
    status: 'Active',
  },
  {
    id: 2,
    name: 'AWS Cloud Services',
    cost: 2450,
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Software',
    start_date: '2026-01-01',
    next_renewal: '2026-08-20',
    is_active: true,
    status: 'Unused',
  },
];

describe('Subscriptions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders subscription items returned from API', async () => {
    client.get.mockResolvedValueOnce({ data: mockSubscriptions });

    render(<Subscriptions />);

    await waitFor(() => {
      expect(screen.getByText('Netflix Premium')).toBeInTheDocument();
      expect(screen.getByText('AWS Cloud Services')).toBeInTheDocument();
    });
  });

  it('filters subscriptions by search query', async () => {
    client.get.mockResolvedValueOnce({ data: mockSubscriptions });

    render(<Subscriptions />);

    await waitFor(() => expect(screen.getByText('Netflix Premium')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/search name or category/i);
    fireEvent.change(searchInput, { target: { value: 'AWS' } });

    expect(screen.getByText('AWS Cloud Services')).toBeInTheDocument();
    expect(screen.queryByText('Netflix Premium')).not.toBeInTheDocument();
  });

  it('filters subscriptions by status dropdown', async () => {
    client.get.mockResolvedValueOnce({ data: mockSubscriptions });

    render(<Subscriptions />);

    await waitFor(() => expect(screen.getByText('Netflix Premium')).toBeInTheDocument());

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0]; // Status select filter

    fireEvent.change(statusSelect, { target: { value: 'Unused' } });

    expect(screen.getByText('AWS Cloud Services')).toBeInTheDocument();
    expect(screen.queryByText('Netflix Premium')).not.toBeInTheDocument();
  });
});
