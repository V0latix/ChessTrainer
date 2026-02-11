import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChessComService } from './chess-com.service';

describe('ChessComService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns candidate games and unavailable periods gracefully', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            archives: [
              'https://api.chess.com/pub/player/leo/games/2026/01',
              'https://api.chess.com/pub/player/leo/games/2026/02',
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            games: [
              {
                url: 'https://www.chess.com/game/live/123',
                end_time: 1739232000,
                time_class: 'blitz',
                rated: true,
                rules: 'chess',
                white: { username: 'leo', result: 'win' },
                black: { username: 'maxime', result: 'checkmated' },
              },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      } as Response);

    const service = new ChessComService();
    const result = await service.listCandidateGames('LEO', 2);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(result.username).toBe('leo');
    expect(result.candidate_games).toHaveLength(1);
    expect(result.candidate_games[0]).toEqual(
      expect.objectContaining({
        game_url: 'https://www.chess.com/game/live/123',
        selectable: true,
      }),
    );
    expect(result.unavailable_periods).toEqual([
      {
        period: '2026-01',
        archive_url: 'https://api.chess.com/pub/player/leo/games/2026/01',
        reason: 'archive_unavailable_503',
      },
    ]);
  });

  it('rejects invalid username format', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = new ChessComService();

    await expect(service.listCandidateGames('x', 2)).rejects.toThrow(
      BadRequestException,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws not found when chess.com username does not exist', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    } as Response);

    const service = new ChessComService();

    await expect(service.listCandidateGames('leo', 2)).rejects.toThrow(
      NotFoundException,
    );
  });
});
