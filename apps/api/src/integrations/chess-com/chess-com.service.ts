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

export type RecentArchiveGame = {
  game_url: string;
  period: string;
  pgn: string | null;
  end_time: string | null;
  time_class: string | null;
  rated: boolean;
  rules: string | null;
  white_username: string | null;
  black_username: string | null;
  white_result: string | null;
  black_result: string | null;
};

export type CandidateGame = RecentArchiveGame & {
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

export type RecentArchiveGamesResult = {
  username: string;
  games: RecentArchiveGame[];
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
    const recentGamesResult = await this.fetchRecentArchiveGames(
      username,
      archivesCount,
    );

    return {
      username: recentGamesResult.username,
      candidate_games: recentGamesResult.games.map((game) => ({
        ...game,
        selectable: true,
      })),
      unavailable_periods: recentGamesResult.unavailable_periods,
    };
  }

  async fetchRecentArchiveGames(
    username: string,
    archivesCount = 2,
  ): Promise<RecentArchiveGamesResult> {
    const normalizedUsername = this.validateUsername(username);
    const archivesLimit = Math.max(1, Math.min(12, archivesCount));

    const archivesUrl = `${this.apiBaseUrl}/player/${normalizedUsername}/games/archives`;
    const archivesResponse = await fetch(archivesUrl, {
      headers: this.defaultHeaders(),
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
    const games: RecentArchiveGame[] = [];

    for (const archiveUrl of selectedArchiveUrls) {
      const period = this.periodFromArchiveUrl(archiveUrl);
      const archiveGamesResponse = await fetch(archiveUrl, {
        headers: this.defaultHeaders(),
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

      for (const game of gamesPayload.games ?? []) {
        if (!game.url) {
          continue;
        }

        games.push({
          game_url: game.url,
          period,
          pgn: game.pgn ?? null,
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
        });
      }
    }

    return {
      username: normalizedUsername,
      games,
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

  private defaultHeaders() {
    return {
      'User-Agent':
        'ChessTrainer/0.1 (+https://github.com/V0latix/ChessTrainer)',
    };
  }
}
