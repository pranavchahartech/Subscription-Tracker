import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import client from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  subscribeDemoMode: vi.fn(() => () => {}),
  subscribeApiError: vi.fn(() => () => {}),
}));

const TestConsumer = () => {
  const { user, loading, login, register, logout, updateUserBudget } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user-email">{user ? user.email : 'No user'}</div>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={() => register('new@example.com', 'password123')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => updateUserBudget(6000)}>Update Budget</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores authenticated user session on mount', async () => {
    client.get.mockResolvedValueOnce({
      data: { id: 1, email: 'authenticated@user.com', monthly_budget: 5000 }
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('authenticated@user.com');
    });
  });

  it('handles login success and updates state', async () => {
    client.get.mockRejectedValueOnce(new Error('Unauthorized'));
    client.post.mockRejectedValueOnce(new Error('Refresh failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());

    client.post.mockResolvedValueOnce({
      data: { user: { id: 2, email: 'test@example.com', monthly_budget: 3000 } }
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('handles logout and clears user state', async () => {
    client.get.mockResolvedValueOnce({
      data: { id: 1, email: 'user@example.com', monthly_budget: 5000 }
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com'));

    client.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
    });
  });
});
