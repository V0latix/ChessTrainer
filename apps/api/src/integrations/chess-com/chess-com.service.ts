import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

type ChessComArchivesResponse = {
  archives: string[];
};

type ChessComArchiveGamesResponse = {
  games?: Array<{
    url?: string;
    pgn?: string;
    end_time?: number;
    time_class?: string;
    rated?: boolean;
    rules?: string;
    white?: { username?: string; result?: string; rating?: number };
    black?: { username?: string; result?: string; rating?: number };
  }>;
};

export type CandidateGame = {
  game_url: string;
  period: string;
  end_time: string | null;
  time_class: string | null;
  rated: boolean;
  rules: string | null;
  white_username: string | null;
  black_username: string | null;
  white_result: string | null;
  black_result: string | null;
  selectable: boolean;
};

export type UnavailablePeriod = {
  period: string;
  archive_url: string;
  reason: string;
};

export type CandidateGamesResult = {
  username: string;
  candidate_games: CandidateGame[];
  unavailable_periods: UnavailablePeriod[];
};

@Injectable()
export class ChessComService {
  private readonly apiBaseUrl =
    process.env.CHESSCOM_API_BASE_URL?.replace(/\/$/, '') ??
    'https://api.chess.com/pub';

  async listCandidateGames(
    username: string,
    archivesCount = 2,
  ): Promise<CandidateGamesResult> {
    const normalizedUsername = this.validateUsername(username);
    const archivesLimit = Math.max(1, Math.min(12, archivesCount));

    const archivesUrl = `${this.apiBaseUrl}/player/${normalizedUsername}/games/archives`;
    const archivesResponse = await fetch(archivesUrl, {
      headers: {
        'User-Agent':
          'ChessTrainer/0.1 (+https://github.com/V0latix/ChessTrainer)',
      },
    });

    if (archivesResponse.status === 404) {
      throw new NotFoundException('Chess.com username not found.');
    }

    if (!archivesResponse.ok) {
      throw new BadRequestException(
        `Unable to fetch Chess.com archives (${archivesResponse.status}).`,
      );
    }

    const archivesPayload =
      (await archivesResponse.json()) as ChessComArchivesResponse;
    const archiveUrls = archivesPayload.archives ?? [];

    const selectedArchiveUrls = archiveUrls.slice(-archivesLimit).reverse();
    const unavailablePeriods: UnavailablePeriod[] = [];
    const candidateGames: CandidateGame[] = [];

    for (const archiveUrl of selectedArchiveUrls) {
      const period = this.periodFromArchiveUrl(archiveUrl);
      const archiveGamesResponse = await fetch(archiveUrl, {
        headers: {
          'User-Agent':
            'ChessTrainer/0.1 (+https://github.com/V0latix/ChessTrainer)',
        },
      });

      if (!archiveGamesResponse.ok) {
        unavailablePeriods.push({
          period,
          archive_url: archiveUrl,
          reason: `archive_unavailable_${archiveGamesResponse.status}`,
        });
        continue;
      }

      const gamesPayload =
        (await archiveGamesResponse.json()) as ChessComArchiveGamesResponse;
      const games = gamesPayload.games ?? [];

      for (const game of games) {
        if (!game.url) {
          continue;
        }

        candidateGames.push({
          game_url: game.url,
          period,
          end_time: game.end_time
            ? new Date(game.end_time * 1000).toISOString()
            : null,
          time_class: game.time_class ?? null,
          rated: Boolean(game.rated),
          rules: game.rules ?? null,
          white_username: game.white?.username ?? null,
          black_username: game.black?.username ?? null,
          white_result: game.white?.result ?? null,
          black_result: game.black?.result ?? null,
          selectable: true,
        });
      }
    }

    return {
      username: normalizedUsername,
      candidate_games: candidateGames,
      unavailable_periods: unavailablePeriods,
    };
  }

  private validateUsername(username: string) {
    const normalized = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_-]{3,25}$/;

    if (!usernameRegex.test(normalized)) {
      throw new BadRequestException('Invalid Chess.com username format.');
    }

    return normalized;
  }

  private periodFromArchiveUrl(archiveUrl: string) {
    const match = archiveUrl.match(/\/(\d{4})\/(\d{2})$/);
    if (!match) {
      return 'unknown';
    }

    return `${match[1]}-${match[2]}`;
  }
}
