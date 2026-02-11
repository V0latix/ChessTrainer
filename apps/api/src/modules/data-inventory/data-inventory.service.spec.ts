import { AnalysisJobStatus } from '@prisma/client';
import { DataInventoryService } from './data-inventory.service';

describe('DataInventoryService', () => {
  it('returns counts and latest update context', async () => {
    const service = new DataInventoryService({
      game: {
        count: jest.fn().mockResolvedValue(24),
        findFirst: jest.fn().mockResolvedValue({
          id: 'game-1',
          gameUrl: 'https://www.chess.com/game/live/123',
          chessComUsername: 'leo',
          period: '2026-02',
          createdAt: new Date('2026-02-11T10:00:00.000Z'),
        }),
      },
      analysisJob: {
        count: jest.fn().mockResolvedValue(12),
        findFirst: jest.fn().mockResolvedValue({
          id: 'job-1',
          gameId: 'game-1',
          status: AnalysisJobStatus.completed,
          updatedAt: new Date('2026-02-11T10:05:00.000Z'),
          completedAt: new Date('2026-02-11T10:05:20.000Z'),
        }),
      },
      analysisMoveEvaluation: {
        count: jest.fn().mockResolvedValue(580),
      },
      criticalMistake: {
        count: jest.fn().mockResolvedValue(35),
        findFirst: jest.fn().mockResolvedValue({
          id: 'mistake-1',
          gameId: 'game-1',
          category: 'endgame_blunder',
          createdAt: new Date('2026-02-11T10:06:00.000Z'),
        }),
      },
      puzzleSession: {
        count: jest.fn().mockResolvedValue(8),
      },
    } as any);

    await expect(
      service.getInventory({
        user_id: 'local-user-1',
      }),
    ).resolves.toEqual({
      generated_at: expect.any(String),
      counts: {
        games_count: 24,
        analyses_count: 12,
        move_evaluations_count: 580,
        critical_mistakes_count: 35,
        puzzle_sessions_count: 8,
      },
      latest_updates: {
        last_game_import: {
          game_id: 'game-1',
          game_url: 'https://www.chess.com/game/live/123',
          chess_com_username: 'leo',
          period: '2026-02',
          imported_at: '2026-02-11T10:00:00.000Z',
        },
        last_analysis_update: {
          job_id: 'job-1',
          game_id: 'game-1',
          status: AnalysisJobStatus.completed,
          updated_at: '2026-02-11T10:05:00.000Z',
          completed_at: '2026-02-11T10:05:20.000Z',
        },
        last_mistake_update: {
          mistake_id: 'mistake-1',
          game_id: 'game-1',
          category: 'endgame_blunder',
          updated_at: '2026-02-11T10:06:00.000Z',
        },
      },
    });
  });

  it('returns null latest updates when user has no stored records', async () => {
    const service = new DataInventoryService({
      game: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      analysisJob: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      analysisMoveEvaluation: {
        count: jest.fn().mockResolvedValue(0),
      },
      criticalMistake: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      puzzleSession: {
        count: jest.fn().mockResolvedValue(0),
      },
    } as any);

    await expect(
      service.getInventory({
        user_id: 'local-user-1',
      }),
    ).resolves.toEqual({
      generated_at: expect.any(String),
      counts: {
        games_count: 0,
        analyses_count: 0,
        move_evaluations_count: 0,
        critical_mistakes_count: 0,
        puzzle_sessions_count: 0,
      },
      latest_updates: {
        last_game_import: null,
        last_analysis_update: null,
        last_mistake_update: null,
      },
    });
  });

  it('deletes selected datasets and returns deleted/remaining counts', async () => {
    const tx = {
      game: {
        count: jest.fn().mockResolvedValueOnce(24).mockResolvedValueOnce(24),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      analysisJob: {
        count: jest.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(0),
        deleteMany: jest.fn().mockResolvedValue({ count: 12 }),
      },
      analysisMoveEvaluation: {
        count: jest.fn().mockResolvedValueOnce(580).mockResolvedValueOnce(0),
      },
      criticalMistake: {
        count: jest.fn().mockResolvedValueOnce(35).mockResolvedValueOnce(0),
      },
      puzzleSession: {
        count: jest.fn().mockResolvedValueOnce(8).mockResolvedValueOnce(0),
        deleteMany: jest.fn().mockResolvedValue({ count: 8 }),
      },
      userMistakeSummary: {
        count: jest.fn().mockResolvedValueOnce(4),
        deleteMany: jest.fn().mockResolvedValue({ count: 4 }),
      },
    };

    const service = new DataInventoryService({
      $transaction: jest.fn((callback: (client: unknown) => unknown) =>
        callback(tx as any),
      ),
    } as any);

    await expect(
      service.deleteDatasets({
        user_id: 'local-user-1',
        dataset_keys: ['analyses', 'puzzle_sessions'],
      }),
    ).resolves.toEqual({
      deleted_datasets: ['analyses', 'puzzle_sessions'],
      deleted_counts: {
        games_count: 0,
        analyses_count: 12,
        move_evaluations_count: 580,
        critical_mistakes_count: 35,
        puzzle_sessions_count: 8,
        user_mistake_summaries_count: 4,
      },
      remaining_counts: {
        games_count: 24,
        analyses_count: 0,
        move_evaluations_count: 0,
        critical_mistakes_count: 0,
        puzzle_sessions_count: 0,
      },
      deleted_at: expect.any(String),
    });

    expect(tx.analysisJob.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'local-user-1',
      },
    });
    expect(tx.puzzleSession.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'local-user-1',
      },
    });
    expect(tx.userMistakeSummary.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'local-user-1',
      },
    });
  });
});
