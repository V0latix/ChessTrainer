import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePage } from './PuzzlePage';

const { getNextPuzzleMock } = vi.hoisted(() => {
  return {
    getNextPuzzleMock: vi.fn(),
  };
});

vi.mock('../../lib/puzzles', () => {
  return {
    getNextPuzzle: getNextPuzzleMock,
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
