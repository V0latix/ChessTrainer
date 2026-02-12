import { BadRequestException } from '@nestjs/common';
import { CoachReviewController } from './coach-review.controller';

describe('CoachReviewController', () => {
  it('imports games for selected student', async () => {
    const importStudentGames = jest.fn().mockResolvedValue({
      username: 'leoChess',
      scanned_count: 12,
      imported_count: 4,
      already_existing_count: 8,
      failed_count: 0,
      failures: [],
      unavailable_periods: [],
    });

    const controller = new CoachReviewController({
      importStudentGames,
      listStudentMistakes: jest.fn(),
    } as any);

    await expect(
      controller.importStudentGames(
        {
          local_user_id: 'coach-1',
          supabase_sub: 'sub-coach-1',
          email: 'coach@example.com',
          role: 'coach',
        },
        {
          student_user_id: 'student-1',
          chess_com_username: 'leoChess',
        },
      ),
    ).resolves.toEqual({
      data: {
        student_user_id: 'student-1',
        username: 'leoChess',
        scanned_count: 12,
        imported_count: 4,
        already_existing_count: 8,
        failed_count: 0,
        failures: [],
        unavailable_periods: [],
      },
    });

    expect(importStudentGames).toHaveBeenCalledWith({
      coach_user_id: 'coach-1',
      actor_role: 'coach',
      student_user_id: 'student-1',
      chess_com_username: 'leoChess',
    });
  });

  it('lists coach review mistakes', async () => {
    const listStudentMistakes = jest.fn().mockResolvedValue({
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
          wrong_move_explanation: 'wrong',
          best_move_explanation: 'best',
        },
      ],
    });

    const controller = new CoachReviewController({
      importStudentGames: jest.fn(),
      listStudentMistakes,
    } as any);

    await expect(
      controller.listStudentMistakes(
        {
          local_user_id: 'coach-1',
          supabase_sub: 'sub-coach-1',
          email: 'coach@example.com',
          role: 'coach',
        },
        'student-1',
        '99',
      ),
    ).resolves.toEqual({
      data: {
        student_user_id: 'student-1',
        mistakes: [expect.objectContaining({ mistake_id: 'mistake-1' })],
      },
    });

    expect(listStudentMistakes).toHaveBeenCalledWith({
      coach_user_id: 'coach-1',
      actor_role: 'coach',
      student_user_id: 'student-1',
      limit: 25,
    });
  });

  it('rejects missing required params', async () => {
    const controller = new CoachReviewController({
      importStudentGames: jest.fn(),
      listStudentMistakes: jest.fn(),
    } as any);

    await expect(
      controller.importStudentGames(
        {
          local_user_id: 'coach-1',
          supabase_sub: 'sub-coach-1',
          email: 'coach@example.com',
          role: 'coach',
        },
        {
          student_user_id: 'student-1',
        },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.listStudentMistakes(
        {
          local_user_id: 'coach-1',
          supabase_sub: 'sub-coach-1',
          email: 'coach@example.com',
          role: 'coach',
        },
        '',
        '10',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
