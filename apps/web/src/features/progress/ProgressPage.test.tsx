import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressPage } from './ProgressPage';

const { getProgressSummaryMock } = vi.hoisted(() => {
  return {
    getProgressSummaryMock: vi.fn(),
  };
});

vi.mock('../../lib/progress', () => {
  return {
    getProgressSummary: getProgressSummaryMock,
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

describe('ProgressPage', () => {
  beforeEach(() => {
    getProgressSummaryMock.mockReset();
  });

  it('loads and renders compact progress metrics', async () => {
    getProgressSummaryMock.mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      sessions_completed: 3,
      puzzles_completed: 24,
      puzzles_solved: 15,
      puzzles_skipped: 9,
      success_rate_percent: 62.5,
      last_session_at: '2026-02-11T10:00:00.000Z',
      recent_mistakes: [
        {
          category: 'endgame_blunder',
          mistake_count: 9,
          average_eval_drop_cp: 380,
          updated_at: '2026-02-11T09:00:00.000Z',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getProgressSummaryMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
      });
    });

    expect(screen.getByTestId('progress-sessions-completed')).toHaveTextContent('3');
    expect(screen.getByTestId('progress-puzzles-completed')).toHaveTextContent('24');
    expect(screen.getByTestId('progress-success-rate')).toHaveTextContent('62.5%');
    expect(screen.getByText(/endgame_blunder/i)).toBeInTheDocument();
  });

  it('shows empty mistakes state when no recurrent categories exist', async () => {
    getProgressSummaryMock.mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      sessions_completed: 0,
      puzzles_completed: 0,
      puzzles_solved: 0,
      puzzles_skipped: 0,
      success_rate_percent: null,
      last_session_at: null,
      recent_mistakes: [],
    });

    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getProgressSummaryMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/Aucun motif d’erreur disponible pour le moment/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('progress-success-rate')).toHaveTextContent('N/A');
  });
});
