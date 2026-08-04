import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DemoBanner from '../components/DemoBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import * as clientModule from '../api/client';

describe('DemoBanner & ErrorBoundary', () => {
  it('renders Demo Mode banner when demo mode subscriber is called with true', () => {
    vi.spyOn(clientModule, 'subscribeDemoMode').mockImplementation((callback) => {
      callback(true);
      return () => {};
    });

    render(<DemoBanner />);
    expect(screen.getByTestId('demo-mode-banner')).toBeInTheDocument();
    expect(screen.getByText(/Demo Mode — backend unreachable, showing sample data/i)).toBeInTheDocument();
  });

  it('hides Demo Mode banner when demo mode is false', () => {
    vi.spyOn(clientModule, 'subscribeDemoMode').mockImplementation((callback) => {
      callback(false);
      return () => {};
    });

    render(<DemoBanner />);
    expect(screen.queryByTestId('demo-mode-banner')).not.toBeInTheDocument();
  });

  it('ErrorBoundary renders error fallback UI on throw', () => {
    const ProblemChild = () => {
      throw new Error('Test rendering crash');
    };

    // Suppress console error for expected throw test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
