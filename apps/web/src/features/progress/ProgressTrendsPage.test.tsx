import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressTrendsPage } from './ProgressTrendsPage';

const { getProgressTrendsMock } = vi.hoisted(() => {
  return {
    getProgressTrendsMock: vi.fn(),
  };
});

vi.mock('../../lib/progress', () => {
  return {
    getProgressTrends: getProgressTrendsMock,
  };
});

vi.mock('../auth/auth-context', () => {
  return {
    useAuth: () => ({
      session: {
        access_token: 'access-token-1',
        user: {
          email: 'leo@example.com',
        },
      },
      isLoading: false,
      isConfigured: true,
    }),
  };
});

describe('ProgressTrendsPage', () => {
  beforeEach(() => {
    getProgressTrendsMock.mockReset();
  });

  it('renders ranked recurring categories with clear trend direction', async () => {
    getProgressTrendsMock.mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      window_days: 14,
      compared_to_days: 14,
      categories: [
        {
          category: 'endgame_blunder',
          recent_count: 9,
          previous_count: 5,
          delta_count: 4,
          trend_direction: 'up',
          average_eval_drop_cp: 320,
        },
        {
          category: 'opening_mistake',
          recent_count: 4,
          previous_count: 6,
          delta_count: -2,
          trend_direction: 'down',
          average_eval_drop_cp: 210,
        },
      ],
    });

    render(
      <MemoryRouter>
        <ProgressTrendsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getProgressTrendsMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        days: 14,
        limit: 8,
      });
    });

    expect(screen.getByText(/endgame_blunder/i)).toBeInTheDocument();
    expect(screen.getByText(/opening_mistake/i)).toBeInTheDocument();
    expect(
      screen.getByTestId('trend-direction-endgame_blunder'),
    ).toHaveTextContent('Hausse');
    expect(
      screen.getByTestId('trend-direction-opening_mistake'),
    ).toHaveTextContent('Baisse');
  });

  it('shows empty state when no trend is available', async () => {
    getProgressTrendsMock.mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      window_days: 14,
      compared_to_days: 14,
      categories: [],
    });

    render(
      <MemoryRouter>
        <ProgressTrendsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getProgressTrendsMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/Aucune tendance exploitable pour le moment/i),
    ).toBeInTheDocument();
  });
});
