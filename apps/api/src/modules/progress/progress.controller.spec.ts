import { BadRequestException } from '@nestjs/common';
import { ProgressController } from './progress.controller';

describe('ProgressController', () => {
  it('returns progress summary payload', async () => {
    const getSummary = jest.fn().mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
      sessions_completed: 2,
      puzzles_completed: 15,
      puzzles_solved: 10,
      puzzles_skipped: 5,
      success_rate_percent: 66.7,
      last_session_at: '2026-02-10T00:00:00.000Z',
      recent_mistakes: [],
    });

    const controller = new ProgressController({
      getSummary,
      recordPuzzleSession: jest.fn(),
    } as any);

    await expect(
      controller.getSummary({
        local_user_id: 'local-user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      }),
    ).resolves.toEqual({
      data: {
        generated_at: '2026-02-11T00:00:00.000Z',
        sessions_completed: 2,
        puzzles_completed: 15,
        puzzles_solved: 10,
        puzzles_skipped: 5,
        success_rate_percent: 66.7,
        last_session_at: '2026-02-10T00:00:00.000Z',
        recent_mistakes: [],
      },
    });

    expect(getSummary).toHaveBeenCalledWith({
      user_id: 'local-user-1',
    });
  });

  it('records a puzzle session', async () => {
    const recordPuzzleSession = jest.fn().mockResolvedValue({
      session_id: 'session-1',
      total_puzzles: 10,
      solved_puzzles: 6,
      skipped_puzzles: 4,
      success_rate_percent: 60,
      created_at: '2026-02-11T00:00:00.000Z',
    });

    const controller = new ProgressController({
      getSummary: jest.fn(),
      recordPuzzleSession,
    } as any);

    await expect(
      controller.recordPuzzleSession(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          total_puzzles: 10,
          solved_puzzles: 6,
          skipped_puzzles: 4,
        },
      ),
    ).resolves.toEqual({
      data: {
        session_id: 'session-1',
        total_puzzles: 10,
        solved_puzzles: 6,
        skipped_puzzles: 4,
        success_rate_percent: 60,
        created_at: '2026-02-11T00:00:00.000Z',
      },
    });

    expect(recordPuzzleSession).toHaveBeenCalledWith({
      user_id: 'local-user-1',
      total_puzzles: 10,
      solved_puzzles: 6,
      skipped_puzzles: 4,
    });
  });

  it('rejects invalid progress session payload', async () => {
    const controller = new ProgressController({
      getSummary: jest.fn(),
      recordPuzzleSession: jest.fn(),
    } as any);

    await expect(
      controller.recordPuzzleSession(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          total_puzzles: 5,
          solved_puzzles: 3,
          skipped_puzzles: 3,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
