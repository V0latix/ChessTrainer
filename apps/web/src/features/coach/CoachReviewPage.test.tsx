import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachReviewPage } from './CoachReviewPage';

const {
  getCoachReviewMistakesMock,
  importCoachStudentGamesMock,
  readSelectedCoachContextMock,
} = vi.hoisted(() => {
  return {
    getCoachReviewMistakesMock: vi.fn(),
    importCoachStudentGamesMock: vi.fn(),
    readSelectedCoachContextMock: vi.fn(),
  };
});

vi.mock('../../lib/coach-review', () => {
  return {
    getCoachReviewMistakes: getCoachReviewMistakesMock,
    importCoachStudentGames: importCoachStudentGamesMock,
  };
});

vi.mock('../../lib/coach-context', () => {
  return {
    readSelectedCoachContext: readSelectedCoachContextMock,
  };
});

vi.mock('../auth/auth-context', () => {
  return {
    useAuth: () => ({
      session: {
        access_token: 'access-token-1',
        user: {
          email: 'coach@example.com',
        },
      },
      isLoading: false,
      isConfigured: true,
    }),
  };
});

describe('CoachReviewPage', () => {
  beforeEach(() => {
    getCoachReviewMistakesMock.mockReset();
    importCoachStudentGamesMock.mockReset();
    readSelectedCoachContextMock.mockReset();
  });

  it('shows missing context state when no coach context is selected', async () => {
    readSelectedCoachContextMock.mockReturnValue(null);

    render(
      <MemoryRouter>
        <CoachReviewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Contexte manquant/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(getCoachReviewMistakesMock).not.toHaveBeenCalled();
    });
  });

  it('loads mistakes and opens selected mistake context', async () => {
    const user = userEvent.setup();

    readSelectedCoachContextMock.mockReturnValue({
      context_id: 'coach-1:student-1',
      coach_user_id: 'coach-1',
      student_user_id: 'student-1',
      selected_at: '2026-02-11T10:00:00.000Z',
    });

    getCoachReviewMistakesMock.mockResolvedValue({
      student_user_id: 'student-1',
      mistakes: [
        {
          mistake_id: 'mistake-1',
          game_id: 'game-1',
          game_url: 'https://www.chess.com/game/live/123',
          chess_com_username: 'leoChess',
          fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
          phase: 'endgame',
          severity: 'blunder',
          category: 'endgame_blunder',
          played_move_uci: 'h1h2',
          best_move_uci: 'h1g1',
          eval_drop_cp: 540,
          ply_index: 60,
          created_at: '2026-02-11T00:00:00.000Z',
          wrong_move_explanation: 'Mauvais coup en finale.',
          best_move_explanation: 'Bon coup en finale.',
        },
        {
          mistake_id: 'mistake-2',
          game_id: 'game-2',
          game_url: 'https://www.chess.com/game/live/456',
          chess_com_username: 'leoChess',
          fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
          phase: 'middlegame',
          severity: 'mistake',
          category: 'tactic_miss',
          played_move_uci: 'a2a3',
          best_move_uci: 'a2a4',
          eval_drop_cp: 210,
          ply_index: 20,
          created_at: '2026-02-11T00:02:00.000Z',
          wrong_move_explanation: 'Mauvais coup tactique.',
          best_move_explanation: 'Bon coup tactique.',
        },
      ],
    });

    render(
      <MemoryRouter>
        <CoachReviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getCoachReviewMistakesMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        studentUserId: 'student-1',
        limit: 12,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Mauvais coup en finale/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /https:\/\/www\.chess\.com\/game\/live\/123/i }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Ouvrir/i })[1]);

    await waitFor(() => {
      expect(screen.getByText(/Mauvais coup tactique/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /https:\/\/www\.chess\.com\/game\/live\/456/i }),
    ).toBeInTheDocument();
  });

  it('imports student games then refreshes mistakes list', async () => {
    const user = userEvent.setup();

    readSelectedCoachContextMock.mockReturnValue({
      context_id: 'coach-1:student-1',
      coach_user_id: 'coach-1',
      student_user_id: 'student-1',
      selected_at: '2026-02-11T10:00:00.000Z',
    });

    getCoachReviewMistakesMock
      .mockResolvedValueOnce({
        student_user_id: 'student-1',
        mistakes: [],
      })
      .mockResolvedValueOnce({
        student_user_id: 'student-1',
        mistakes: [
          {
            mistake_id: 'mistake-9',
            game_id: 'game-9',
            game_url: 'https://www.chess.com/game/live/999',
            chess_com_username: 'leoChess',
            fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
            phase: 'endgame',
            severity: 'blunder',
            category: 'endgame_blunder',
            played_move_uci: 'h1h2',
            best_move_uci: 'h1g1',
            eval_drop_cp: 510,
            ply_index: 42,
            created_at: '2026-02-11T00:00:00.000Z',
            wrong_move_explanation: 'Mauvais coup.',
            best_move_explanation: 'Bon coup.',
          },
        ],
      });

    importCoachStudentGamesMock.mockResolvedValue({
      student_user_id: 'student-1',
      username: 'leoChess',
      scanned_count: 10,
      imported_count: 3,
      already_existing_count: 7,
      failed_count: 0,
      failures: [],
      unavailable_periods: [],
    });

    render(
      <MemoryRouter>
        <CoachReviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getCoachReviewMistakesMock).toHaveBeenCalledTimes(1);
    });

    await user.type(
      screen.getByLabelText(/Pseudo Chess\.com de l’élève/i),
      'leoChess',
    );
    await user.click(
      screen.getByRole('button', { name: /Importer les parties de l’élève/i }),
    );

    await waitFor(() => {
      expect(importCoachStudentGamesMock).toHaveBeenCalledWith({
        accessToken: 'access-token-1',
        studentUserId: 'student-1',
        chessComUsername: 'leoChess',
      });
    });

    await waitFor(() => {
      expect(getCoachReviewMistakesMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByTestId('coach-import-summary')).toHaveTextContent(
      /Import: 3 nouvelles, 7 déjà présentes/i,
    );
    expect(screen.getByText(/Mauvais coup\./i)).toBeInTheDocument();
  });
});
