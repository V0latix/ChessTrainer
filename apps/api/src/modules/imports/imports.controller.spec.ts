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

    const controller = new ImportsController({ listCandidateGames } as any);

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
});
