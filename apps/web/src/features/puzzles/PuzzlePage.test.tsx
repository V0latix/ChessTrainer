import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzlePage } from './PuzzlePage';

const { getPuzzleSessionMock, evaluatePuzzleAttemptMock } = vi.hoisted(() => {
  return {
    getPuzzleSessionMock: vi.fn(),
    evaluatePuzzleAttemptMock: vi.fn(),
  };
});

vi.mock('../../lib/puzzles', () => {
  return {
    getPuzzleSession: getPuzzleSessionMock,
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
    getPuzzleSessionMock.mockReset();
    evaluatePuzzleAttemptMock.mockReset();
  });

  it('loads puzzle session and renders first puzzle', async () => {
    getPuzzleSessionMock.mockResolvedValue({
      session_id: 'session-1',
      generated_at: '2026-02-11T00:00:00.000Z',
      total_puzzles: 1,
      puzzles: [
        {
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
        },
      ],
    });

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getPuzzleSessionMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        limit: 10,
      });
    });

    expect(screen.getByText(/Trouve le meilleur coup/i)).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: /échiquier interactif/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('session-completed')).toHaveTextContent(
      'Progression: 0/1',
    );
  });

  it('moves to next puzzle when solved and continue is clicked', async () => {
    const user = userEvent.setup();

    getPuzzleSessionMock.mockResolvedValue({
      session_id: 'session-1',
      generated_at: '2026-02-11T00:00:00.000Z',
      total_puzzles: 2,
      puzzles: [
        {
          puzzle_id: 'mistake-1',
          source: 'critical_mistake',
          fen: '7k/8/8/8/8/8/7p/K7 b - - 0 1',
          side_to_move: 'black',
          objective: 'Puzzle 1',
          context: {
            game_id: 'game-1',
            game_url: 'https://www.chess.com/game/live/123',
            chess_com_username: 'leo',
            period: '2026-02',
            time_class: 'rapid',
            phase: 'endgame',
            severity: 'blunder',
            category: 'endgame_blunder',
            played_move_uci: 'h2h1q',
            best_move_uci: 'h2h1q',
            eval_drop_cp: 540,
            ply_index: 60,
            created_at: '2026-02-11T00:00:00.000Z',
          },
        },
        {
          puzzle_id: 'mistake-2',
          source: 'critical_mistake',
          fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
          side_to_move: 'black',
          objective: 'Puzzle 2',
          context: {
            game_id: 'game-2',
            game_url: 'https://www.chess.com/game/live/124',
            chess_com_username: 'leo',
            period: '2026-02',
            time_class: 'blitz',
            phase: 'endgame',
            severity: 'mistake',
            category: 'endgame_mistake',
            played_move_uci: 'h1h2',
            best_move_uci: 'h1g1',
            eval_drop_cp: 220,
            ply_index: 42,
            created_at: '2026-02-11T00:10:00.000Z',
          },
        },
      ],
    });

    evaluatePuzzleAttemptMock.mockResolvedValue({
      puzzle_id: 'mistake-1',
      attempted_move_uci: 'h2h1q',
      best_move_uci: 'h2h1q',
      is_correct: true,
      status: 'correct',
      feedback_title: 'Bien joué',
      feedback_message: 'Excellent: c’est le meilleur coup dans cette position.',
      wrong_move_explanation:
        'Ton coup h2h1q correspond déjà au meilleur choix de la position.',
      best_move_explanation:
        "Le coup h2h1q est meilleur car il améliore l'activité du roi et la coordination des pions. C’est la ressource la plus solide contre une erreur de type blunder.",
      retry_available: false,
    });

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Puzzle 1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Case h2/i }));
    await user.click(screen.getByRole('button', { name: /Case h1/i }));

    await waitFor(() => {
      expect(evaluatePuzzleAttemptMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        puzzleId: 'mistake-1',
        attemptedMoveUci: 'h2h1q',
      });
    });

    expect(screen.getByText(/Pourquoi ce coup \?/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Continuer au puzzle suivant/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Puzzle 2')).toBeInTheDocument();
    });
    expect(screen.getByTestId('session-completed')).toHaveTextContent(
      'Progression: 1/2',
    );
  });

  it('shows empty-state when no puzzle is available', async () => {
    getPuzzleSessionMock.mockResolvedValue({
      session_id: 'session-empty',
      generated_at: '2026-02-11T00:00:00.000Z',
      total_puzzles: 0,
      puzzles: [],
    });

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getPuzzleSessionMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Aucun puzzle disponible/i)).toBeInTheDocument();
  });

  it('renders explanation panel details after an incorrect attempt', async () => {
    const user = userEvent.setup();

    getPuzzleSessionMock.mockResolvedValue({
      session_id: 'session-1',
      generated_at: '2026-02-11T00:00:00.000Z',
      total_puzzles: 1,
      puzzles: [
        {
          puzzle_id: 'mistake-1',
          source: 'critical_mistake',
          fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
          side_to_move: 'black',
          objective: 'Puzzle 1',
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
        },
      ],
    });

    evaluatePuzzleAttemptMock.mockResolvedValue({
      puzzle_id: 'mistake-1',
      attempted_move_uci: 'h1h2',
      best_move_uci: 'h1g1',
      is_correct: false,
      status: 'incorrect',
      feedback_title: 'Presque',
      feedback_message: 'Ce n’est pas le meilleur coup. Essaie encore: h1g1.',
      wrong_move_explanation:
        'Le coup h1h2 en endgame (blunder) laisse passer une idée clé et coûte environ 540 centipawns.',
      best_move_explanation:
        "Le coup h1g1 est meilleur car il améliore l'activité du roi et la coordination des pions. C’est la ressource la plus solide contre une erreur de type blunder.",
      retry_available: true,
    });

    render(
      <MemoryRouter>
        <PuzzlePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Puzzle 1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Case h1/i }));
    await user.click(screen.getByRole('button', { name: /Case h2/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Le coup h1h2 en endgame \(blunder\) laisse passer une idée clé/i,
        ),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Le coup h1g1 est meilleur car il améliore l'activité du roi/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare ton idée au coup h1g1 avant de jouer pour éviter ce type d’erreur/i,
      ),
    ).toBeInTheDocument();
  });
});
