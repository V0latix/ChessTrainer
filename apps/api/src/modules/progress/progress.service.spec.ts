import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  it('records a puzzle session and returns computed success rate', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'session-1',
      totalPuzzles: 10,
      solvedPuzzles: 6,
      skippedPuzzles: 4,
      createdAt: new Date('2026-02-11T00:00:00.000Z'),
    });

    const service = new ProgressService({
      puzzleSession: {
        create,
      },
    } as any);

    await expect(
      service.recordPuzzleSession({
        user_id: 'local-user-1',
        total_puzzles: 10,
        solved_puzzles: 6,
        skipped_puzzles: 4,
      }),
    ).resolves.toEqual({
      session_id: 'session-1',
      total_puzzles: 10,
      solved_puzzles: 6,
      skipped_puzzles: 4,
      success_rate_percent: 60,
      created_at: '2026-02-11T00:00:00.000Z',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'local-user-1',
        totalPuzzles: 10,
        solvedPuzzles: 6,
        skippedPuzzles: 4,
      },
      select: {
        id: true,
        totalPuzzles: true,
        solvedPuzzles: true,
        skippedPuzzles: true,
        createdAt: true,
      },
    });
  });

  it('returns summary with key metrics and top mistake categories', async () => {
    const aggregate = jest.fn().mockResolvedValue({
      _count: {
        _all: 3,
      },
      _sum: {
        totalPuzzles: 24,
        solvedPuzzles: 15,
        skippedPuzzles: 9,
      },
    });

    const findFirst = jest.fn().mockResolvedValue({
      createdAt: new Date('2026-02-11T10:00:00.000Z'),
    });

    const findMany = jest.fn().mockResolvedValue([
      {
        category: 'endgame_blunder',
        mistakeCount: 9,
        averageEvalDropCp: 380,
        updatedAt: new Date('2026-02-11T09:00:00.000Z'),
      },
      {
        category: 'opening_mistake',
        mistakeCount: 5,
        averageEvalDropCp: 210,
        updatedAt: new Date('2026-02-10T09:00:00.000Z'),
      },
    ]);

    const service = new ProgressService({
      puzzleSession: {
        aggregate,
        findFirst,
      },
      userMistakeSummary: {
        findMany,
      },
    } as any);

    const result = await service.getSummary({
      user_id: 'local-user-1',
    });

    expect(result).toEqual({
      generated_at: expect.any(String),
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
        {
          category: 'opening_mistake',
          mistake_count: 5,
          average_eval_drop_cp: 210,
          updated_at: '2026-02-10T09:00:00.000Z',
        },
      ],
    });
  });

  it('returns zero/empty summary when no sessions exist', async () => {
    const service = new ProgressService({
      puzzleSession: {
        aggregate: jest.fn().mockResolvedValue({
          _count: {
            _all: 0,
          },
          _sum: {
            totalPuzzles: null,
            solvedPuzzles: null,
            skippedPuzzles: null,
          },
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      userMistakeSummary: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any);

    await expect(
      service.getSummary({
        user_id: 'local-user-1',
      }),
    ).resolves.toEqual({
      generated_at: expect.any(String),
      sessions_completed: 0,
      puzzles_completed: 0,
      puzzles_solved: 0,
      puzzles_skipped: 0,
      success_rate_percent: null,
      last_session_at: null,
      recent_mistakes: [],
    });
  });
});
