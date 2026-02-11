import { ImportsService } from './imports.service';

describe('ImportsService', () => {
  it('persists selected games only and returns summary counts', async () => {
    const fetchRecentArchiveGames = jest.fn().mockResolvedValue({
      username: 'leo',
      games: [
        {
          game_url: 'https://www.chess.com/game/live/123',
          period: '2026-02',
          pgn: '1. e4 e5',
          end_time: '2026-02-11T00:00:00.000Z',
          time_class: 'blitz',
          rated: true,
          rules: 'chess',
          white_username: 'leo',
          black_username: 'maxime',
          white_result: 'win',
          black_result: 'checkmated',
        },
      ],
      unavailable_periods: [],
    });

    const findUnique = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'game-existing' });

    const create = jest.fn().mockResolvedValue({ id: 'game-created' });

    const service = new ImportsService(
      {
        listCandidateGames: jest.fn(),
        fetchRecentArchiveGames,
      } as any,
      {
        game: {
          findUnique,
          create,
        },
      } as any,
    );

    const summary = await service.importSelectedGames({
      user_id: 'local-user-1',
      username: 'leo',
      selected_game_urls: [
        'https://www.chess.com/game/live/123',
        'https://www.chess.com/game/live/124',
      ],
      archives_count: 2,
    });

    expect(summary).toEqual({
      username: 'leo',
      selected_count: 2,
      imported_count: 1,
      already_existing_count: 0,
      failed_count: 1,
      failures: [
        {
          game_url: 'https://www.chess.com/game/live/124',
          reason: 'not_found_in_recent_archives',
        },
      ],
    });

    expect(fetchRecentArchiveGames).toHaveBeenCalledWith('leo', 2);
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'local-user-1',
        provider: 'chess_com',
        gameUrl: 'https://www.chess.com/game/live/123',
        chessComUsername: 'leo',
        period: '2026-02',
        pgn: '1. e4 e5',
        endTime: new Date('2026-02-11T00:00:00.000Z'),
        timeClass: 'blitz',
        rated: true,
        rules: 'chess',
      },
    });
  });

  it('counts already existing games in summary', async () => {
    const service = new ImportsService(
      {
        listCandidateGames: jest.fn(),
        fetchRecentArchiveGames: jest.fn().mockResolvedValue({
          username: 'leo',
          games: [
            {
              game_url: 'https://www.chess.com/game/live/123',
              period: '2026-02',
              pgn: null,
              end_time: null,
              time_class: 'rapid',
              rated: false,
              rules: 'chess',
              white_username: 'leo',
              black_username: 'maxime',
              white_result: 'draw',
              black_result: 'draw',
            },
          ],
          unavailable_periods: [],
        }),
      } as any,
      {
        game: {
          findUnique: jest.fn().mockResolvedValue({ id: 'existing' }),
          create: jest.fn(),
        },
      } as any,
    );

    const summary = await service.importSelectedGames({
      user_id: 'local-user-1',
      username: 'leo',
      selected_game_urls: ['https://www.chess.com/game/live/123'],
      archives_count: 2,
    });

    expect(summary).toEqual({
      username: 'leo',
      selected_count: 1,
      imported_count: 0,
      already_existing_count: 1,
      failed_count: 0,
      failures: [],
    });
  });

  it('reimports recent games incrementally and skips existing ones', async () => {
    const fetchRecentArchiveGames = jest.fn().mockResolvedValue({
      username: 'leo',
      games: [
        {
          game_url: 'https://www.chess.com/game/live/123',
          period: '2026-02',
          pgn: '1. e4 e5',
          end_time: '2026-02-11T00:00:00.000Z',
          time_class: 'blitz',
          rated: true,
          rules: 'chess',
          white_username: 'leo',
          black_username: 'maxime',
          white_result: 'win',
          black_result: 'checkmated',
        },
        {
          game_url: 'https://www.chess.com/game/live/124',
          period: '2026-02',
          pgn: '1. d4 d5',
          end_time: '2026-02-11T00:10:00.000Z',
          time_class: 'rapid',
          rated: false,
          rules: 'chess',
          white_username: 'leo',
          black_username: 'hugo',
          white_result: 'draw',
          black_result: 'draw',
        },
      ],
      unavailable_periods: [
        {
          period: '2026-01',
          archive_url: 'https://api.chess.com/pub/player/leo/games/2026/01',
          reason: 'archive_unavailable_503',
        },
      ],
    });

    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 'already-existing-123' })
      .mockResolvedValueOnce(null);
    const create = jest.fn().mockResolvedValue({ id: 'game-created-124' });

    const service = new ImportsService(
      {
        listCandidateGames: jest.fn(),
        fetchRecentArchiveGames,
      } as any,
      {
        game: {
          findUnique,
          create,
        },
      } as any,
    );

    const summary = await service.reimportIncrementally({
      user_id: 'local-user-1',
      username: 'leo',
      archives_count: 2,
    });

    expect(summary).toEqual({
      username: 'leo',
      scanned_count: 2,
      imported_count: 1,
      already_existing_count: 1,
      failed_count: 0,
      failures: [],
      unavailable_periods: [
        {
          period: '2026-01',
          archive_url: 'https://api.chess.com/pub/player/leo/games/2026/01',
          reason: 'archive_unavailable_503',
        },
      ],
    });

    expect(fetchRecentArchiveGames).toHaveBeenCalledWith('leo', 2);
    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'local-user-1',
        provider: 'chess_com',
        gameUrl: 'https://www.chess.com/game/live/124',
        chessComUsername: 'leo',
        period: '2026-02',
        pgn: '1. d4 d5',
        endTime: new Date('2026-02-11T00:10:00.000Z'),
        timeClass: 'rapid',
        rated: false,
        rules: 'chess',
      },
    });
  });
});
