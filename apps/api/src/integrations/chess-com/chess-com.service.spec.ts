import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChessComService } from './chess-com.service';

function mockResponse(params: {
  status: number;
  body?: unknown;
  retryAfter?: string;
}): Response {
  return {
    ok: params.status >= 200 && params.status < 300,
    status: params.status,
    json: () => Promise.resolve(params.body ?? {}),
    headers: {
      get: (header: string) => {
        if (header.toLowerCase() !== 'retry-after') {
          return null;
        }

        return params.retryAfter ?? null;
      },
    },
  } as Response;
}

describe('ChessComService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns candidate games and unavailable periods gracefully after retry exhaustion', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          body: {
            archives: [
              'https://api.chess.com/pub/player/leo/games/2026/01',
              'https://api.chess.com/pub/player/leo/games/2026/02',
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          body: {
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
          },
        }),
      )
      .mockResolvedValueOnce(mockResponse({ status: 503 }))
      .mockResolvedValueOnce(mockResponse({ status: 503 }))
      .mockResolvedValueOnce(mockResponse({ status: 503 }));

    const service = new ChessComService();
    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);
    const result = await service.listCandidateGames('LEO', 2);

    expect(fetchSpy).toHaveBeenCalledTimes(5);
    expect(sleepSpy).toHaveBeenNthCalledWith(1, 250);
    expect(sleepSpy).toHaveBeenNthCalledWith(2, 500);
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
        reason: 'archive_unavailable_503_after_3_attempts',
      },
    ]);
  });

  it('retries rate-limit responses with exponential backoff and retry-after hint', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(mockResponse({ status: 429, retryAfter: '1' }))
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          body: {
            archives: ['https://api.chess.com/pub/player/leo/games/2026/02'],
          },
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          body: {
            games: [
              {
                url: 'https://www.chess.com/game/live/123',
                end_time: 1739232000,
              },
            ],
          },
        }),
      );

    const service = new ChessComService();
    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);
    const result = await service.listCandidateGames('leo', 1);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(1);
    expect(sleepSpy).toHaveBeenCalledWith(1000);
    expect(result.candidate_games).toHaveLength(1);
    expect(result.unavailable_periods).toEqual([]);
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
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(mockResponse({ status: 404 }));

    const service = new ChessComService();
    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    await expect(service.listCandidateGames('leo', 2)).rejects.toThrow(
      NotFoundException,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(sleepSpy).not.toHaveBeenCalled();
  });

  it('surfaces final status when archive listing retries are exhausted', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(mockResponse({ status: 503 }));

    const service = new ChessComService();
    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    await expect(service.listCandidateGames('leo', 2)).rejects.toThrow(
      /Unable to fetch Chess.com archives \(503\) after 3 attempts\./i,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenNthCalledWith(1, 250);
    expect(sleepSpy).toHaveBeenNthCalledWith(2, 500);
  });
});
