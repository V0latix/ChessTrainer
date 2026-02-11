import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePage } from './PuzzlePage';

const { getNextPuzzleMock, evaluatePuzzleAttemptMock } = vi.hoisted(() => {
  return {
    getNextPuzzleMock: vi.fn(),
    evaluatePuzzleAttemptMock: vi.fn(),
  };
});

vi.mock('../../lib/puzzles', () => {
  return {
    getNextPuzzle: getNextPuzzleMock,
    evaluatePuzzleAttempt: evaluatePuzzleAttemptMock,
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

describe('PuzzlePage', () => {
  beforeEach(() => {
    getNextPuzzleMock.mockReset();
    evaluatePuzzleAttemptMock.mockReset();
  });

  it('loads next puzzle and renders board + objective context', async () => {
    getNextPuzzleMock.mockResolvedValue({
      puzzle_id: 'mistake-1',
      source: 'critical_mistake',
      fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
      side_to_move: 'black',
      objective: 'Trouve le meilleur coup pour les noirs dans cette position.',
      context: {
        game_id: 'game-1',
        game_url: 'https://www.chess.com/game/live/123',
        chess_com_username: 'leo',
        period: '2026-02',
        time_class: 'rapid',
        phase: 'endgame',
        severity: 'blunder',
        category: 'endgame_blunder',
        played_move_uci: 'h1h2',
        best_move_uci: 'h1g1',
        eval_drop_cp: 540,
        ply_index: 60,
        created_at: '2026-02-11T00:00:00.000Z',
      },
    });

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getNextPuzzleMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
      });
    });

    expect(screen.getByText(/Trouve le meilleur coup/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase: endgame/i)).toBeInTheDocument();
    expect(screen.getByText(/Ton coup: h1h2/i)).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /échiquier interactif/i })).toBeInTheDocument();
  });

  it('shows incorrect feedback then allows retry on the same position', async () => {
    const user = userEvent.setup();

    getNextPuzzleMock.mockResolvedValue({
      puzzle_id: 'mistake-1',
      source: 'critical_mistake',
      fen: '8/8/8/8/8/8/7k/7K b - - 0 1',
      side_to_move: 'black',
      objective: 'Trouve le meilleur coup pour les noirs dans cette position.',
      context: {
        game_id: 'game-1',
        game_url: 'https://www.chess.com/game/live/123',
        chess_com_username: 'leo',
        period: '2026-02',
        time_class: 'rapid',
        phase: 'endgame',
        severity: 'blunder',
        category: 'endgame_blunder',
        played_move_uci: 'h2h1',
        best_move_uci: 'h2g2',
        eval_drop_cp: 540,
        ply_index: 60,
        created_at: '2026-02-11T00:00:00.000Z',
      },
    });
    evaluatePuzzleAttemptMock.mockResolvedValue({
      puzzle_id: 'mistake-1',
      attempted_move_uci: 'h2h1',
      best_move_uci: 'h2g2',
      is_correct: false,
      status: 'incorrect',
      feedback_title: 'Presque',
      feedback_message: 'Ce n’est pas le meilleur coup. Essaie encore: h2g2.',
      retry_available: true,
    });

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('grid', { name: /échiquier interactif/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Case h2/i }));
    await user.click(screen.getByRole('button', { name: /Case h1/i }));

    await waitFor(() => {
      expect(evaluatePuzzleAttemptMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        puzzleId: 'mistake-1',
        attemptedMoveUci: 'h2h1',
      });
    });

    expect(screen.getByText('Presque')).toBeInTheDocument();
    expect(screen.getByText(/Essaie encore/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Réessayer cette position/i }));
    expect(screen.queryByText('Presque')).not.toBeInTheDocument();
  });

  it('shows empty-state when no puzzle is available', async () => {
    getNextPuzzleMock.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getNextPuzzleMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Aucun puzzle disponible/i)).toBeInTheDocument();
  });
});
