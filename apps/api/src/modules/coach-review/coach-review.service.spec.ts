import { ForbiddenException } from '@nestjs/common';
import { CoachReviewService } from './coach-review.service';

describe('CoachReviewService', () => {
  it('imports student games when coach access is valid', async () => {
    const reimportIncrementally = jest.fn().mockResolvedValue({
      username: 'leoChess',
      scanned_count: 12,
      imported_count: 4,
      already_existing_count: 8,
      failed_count: 0,
      failures: [],
      unavailable_periods: [],
    });

    const findFirst = jest.fn().mockResolvedValue({
      id: 'access-1',
    });

    const service = new CoachReviewService(
      {
        coachStudentAccess: {
          findFirst,
        },
      } as any,
      {
        reimportIncrementally,
      } as any,
    );

    await expect(
      service.importStudentGames({
        coach_user_id: 'coach-1',
        actor_role: 'coach',
        student_user_id: 'student-1',
        chess_com_username: 'leoChess',
      }),
    ).resolves.toEqual({
      username: 'leoChess',
      scanned_count: 12,
      imported_count: 4,
      already_existing_count: 8,
      failed_count: 0,
      failures: [],
      unavailable_periods: [],
    });

    expect(reimportIncrementally).toHaveBeenCalledWith({
      user_id: 'student-1',
      username: 'leoChess',
    });
  });

  it('lists mistakes with explanations for authorized student context', async () => {
    const findAccess = jest.fn().mockResolvedValue({
      id: 'access-1',
    });

    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'mistake-1',
        gameId: 'game-1',
        fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
        phase: 'endgame',
        severity: 'blunder',
        category: 'endgame_blunder',
        playedMoveUci: 'h1h2',
        bestMoveUci: 'h1g1',
        evalDropCp: 540,
        plyIndex: 60,
        createdAt: new Date('2026-02-11T00:00:00.000Z'),
        game: {
          gameUrl: 'https://www.chess.com/game/live/123',
          chessComUsername: 'leoChess',
        },
      },
    ]);

    const service = new CoachReviewService(
      {
        coachStudentAccess: {
          findFirst: findAccess,
        },
        criticalMistake: {
          findMany,
        },
      } as any,
      {
        reimportIncrementally: jest.fn(),
      } as any,
    );

    await expect(
      service.listStudentMistakes({
        coach_user_id: 'coach-1',
        actor_role: 'coach',
        student_user_id: 'student-1',
        limit: 10,
      }),
    ).resolves.toEqual({
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
          wrong_move_explanation:
            'Le coup h1h2 en endgame (blunder) a coûté environ 540 centipawns et a dégradé la position du joueur.',
          best_move_explanation:
            "Le coup h1g1 est meilleur car il améliore l'activité du roi et la coordination des pions. C’est la réponse la plus robuste contre une erreur de type blunder.",
        },
      ],
    });
  });

  it('rejects non-coach actor and unauthorized contexts', async () => {
    const service = new CoachReviewService(
      {
        coachStudentAccess: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any,
      {
        reimportIncrementally: jest.fn(),
      } as any,
    );

    await expect(
      service.listStudentMistakes({
        coach_user_id: 'coach-1',
        actor_role: 'user',
        student_user_id: 'student-1',
        limit: 10,
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.importStudentGames({
        coach_user_id: 'coach-1',
        actor_role: 'coach',
        student_user_id: 'student-1',
        chess_com_username: 'leoChess',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
