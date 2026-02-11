import { BadRequestException } from '@nestjs/common';
import { ImportsController } from './imports.controller';

describe('ImportsController', () => {
  it('returns candidate games payload with total count', async () => {
    const listCandidateGames = jest.fn().mockResolvedValue({
      username: 'leo',
      candidate_games: [
        {
          game_url: 'https://www.chess.com/game/live/123',
          period: '2026-02',
          end_time: '2026-02-11T00:00:00.000Z',
          time_class: 'blitz',
          rated: true,
          rules: 'chess',
          white_username: 'leo',
          black_username: 'maxime',
          white_result: 'win',
          black_result: 'checkmated',
          selectable: true,
        },
      ],
      unavailable_periods: [],
    });

    const controller = new ImportsController({
      listCandidateGames,
      importSelectedGames: jest.fn(),
    } as any);

    await expect(
      controller.getChessComCandidateGames('leo', '3'),
    ).resolves.toEqual({
      data: {
        username: 'leo',
        candidate_games: [
          expect.objectContaining({
            game_url: 'https://www.chess.com/game/live/123',
          }),
        ],
        unavailable_periods: [],
        total_candidate_games: 1,
      },
    });

    expect(listCandidateGames).toHaveBeenCalledWith('leo', 3);
  });

  it('imports selected games and returns summary counts', async () => {
    const importSelectedGames = jest.fn().mockResolvedValue({
      username: 'leo',
      selected_count: 2,
      imported_count: 1,
      already_existing_count: 1,
      failed_count: 0,
      failures: [],
    });

    const controller = new ImportsController({
      listCandidateGames: jest.fn(),
      importSelectedGames,
    } as any);

    await expect(
      controller.importSelectedChessComGames(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          username: 'leo',
          selected_game_urls: [
            'https://www.chess.com/game/live/123',
            'https://www.chess.com/game/live/124',
          ],
          archives_count: 2,
        },
      ),
    ).resolves.toEqual({
      data: {
        username: 'leo',
        selected_count: 2,
        imported_count: 1,
        already_existing_count: 1,
        failed_count: 0,
        failures: [],
      },
    });

    expect(importSelectedGames).toHaveBeenCalledWith({
      user_id: 'local-user-1',
      username: 'leo',
      selected_game_urls: [
        'https://www.chess.com/game/live/123',
        'https://www.chess.com/game/live/124',
      ],
      archives_count: 2,
    });
  });

  it('rejects import when selected_game_urls is empty', async () => {
    const controller = new ImportsController({
      listCandidateGames: jest.fn(),
      importSelectedGames: jest.fn(),
    } as any);

    await expect(
      controller.importSelectedChessComGames(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          username: 'leo',
          selected_game_urls: [],
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
