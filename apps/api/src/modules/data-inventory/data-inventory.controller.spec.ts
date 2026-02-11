import { DataInventoryController } from './data-inventory.controller';
import { BadRequestException } from '@nestjs/common';

describe('DataInventoryController', () => {
  it('returns inventory payload for authenticated user', async () => {
    const getInventory = jest.fn().mockResolvedValue({
      generated_at: '2026-02-11T00:00:00.000Z',
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
          status: 'completed',
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

    const controller = new DataInventoryController({
      getInventory,
    } as any);

    await expect(
      controller.getInventory({
        local_user_id: 'local-user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      }),
    ).resolves.toEqual({
      data: {
        generated_at: '2026-02-11T00:00:00.000Z',
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
            status: 'completed',
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
      },
    });

    expect(getInventory).toHaveBeenCalledWith({
      user_id: 'local-user-1',
    });
  });

  it('deletes selected datasets', async () => {
    const deleteDatasets = jest.fn().mockResolvedValue({
      deleted_datasets: ['analyses', 'puzzle_sessions'],
      deleted_counts: {
        games_count: 0,
        analyses_count: 4,
        move_evaluations_count: 120,
        critical_mistakes_count: 18,
        puzzle_sessions_count: 7,
        user_mistake_summaries_count: 3,
      },
      remaining_counts: {
        games_count: 24,
        analyses_count: 8,
        move_evaluations_count: 460,
        critical_mistakes_count: 17,
        puzzle_sessions_count: 1,
      },
      deleted_at: '2026-02-11T00:00:00.000Z',
    });

    const controller = new DataInventoryController({
      getInventory: jest.fn(),
      deleteDatasets,
    } as any);

    await expect(
      controller.deleteDatasets(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          dataset_keys: ['analyses', 'puzzle_sessions'],
        },
      ),
    ).resolves.toEqual({
      data: {
        deleted_datasets: ['analyses', 'puzzle_sessions'],
        deleted_counts: {
          games_count: 0,
          analyses_count: 4,
          move_evaluations_count: 120,
          critical_mistakes_count: 18,
          puzzle_sessions_count: 7,
          user_mistake_summaries_count: 3,
        },
        remaining_counts: {
          games_count: 24,
          analyses_count: 8,
          move_evaluations_count: 460,
          critical_mistakes_count: 17,
          puzzle_sessions_count: 1,
        },
        deleted_at: '2026-02-11T00:00:00.000Z',
      },
    });

    expect(deleteDatasets).toHaveBeenCalledWith({
      user_id: 'local-user-1',
      dataset_keys: ['analyses', 'puzzle_sessions'],
    });
  });

  it('rejects invalid dataset payload', async () => {
    const controller = new DataInventoryController({
      getInventory: jest.fn(),
      deleteDatasets: jest.fn(),
    } as any);

    await expect(
      controller.deleteDatasets(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          dataset_keys: ['unknown'],
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
