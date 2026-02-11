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
  private readonly maxRetries = this.readPositiveIntEnv(
    'CHESSCOM_RETRY_MAX_RETRIES',
    2,
  );
  private readonly retryBaseDelayMs = this.readPositiveIntEnv(
    'CHESSCOM_RETRY_BASE_DELAY_MS',
    250,
  );
  private readonly retryMaxDelayMs = this.readPositiveIntEnv(
    'CHESSCOM_RETRY_MAX_DELAY_MS',
    4000,
  );

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
    const archivesRequest = await this.fetchWithRetry(archivesUrl);

    if (!archivesRequest.response) {
      throw new BadRequestException(
        `Unable to fetch Chess.com archives (network error after ${archivesRequest.attempts} attempts).`,
      );
    }

    const archivesResponse = archivesRequest.response;

    if (archivesResponse.status === 404) {
      throw new NotFoundException('Chess.com username not found.');
    }

    if (!archivesResponse.ok) {
      throw new BadRequestException(
        `Unable to fetch Chess.com archives (${archivesResponse.status}) after ${archivesRequest.attempts} attempts.`,
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
      const archiveRequest = await this.fetchWithRetry(archiveUrl);

      if (!archiveRequest.response) {
        unavailablePeriods.push({
          period,
          archive_url: archiveUrl,
          reason: `archive_unavailable_network_error_after_${archiveRequest.attempts}_attempts`,
        });
        continue;
      }

      const archiveGamesResponse = archiveRequest.response;

      if (!archiveGamesResponse.ok) {
        unavailablePeriods.push({
          period,
          archive_url: archiveUrl,
          reason: `archive_unavailable_${archiveGamesResponse.status}_after_${archiveRequest.attempts}_attempts`,
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

  private async fetchWithRetry(url: string): Promise<{
    response: Response | null;
    attempts: number;
  }> {
    const maxAttempts = this.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: this.defaultHeaders(),
        });

        if (response.ok || !this.isRetryableStatus(response.status)) {
          return {
            response,
            attempts: attempt,
          };
        }

        if (attempt === maxAttempts) {
          return {
            response,
            attempts: attempt,
          };
        }

        await this.sleep(this.resolveBackoffDelayMs(attempt, response));
      } catch {
        if (attempt === maxAttempts) {
          return {
            response: null,
            attempts: attempt,
          };
        }

        await this.sleep(this.resolveBackoffDelayMs(attempt));
      }
    }

    return {
      response: null,
      attempts: maxAttempts,
    };
  }

  private isRetryableStatus(status: number) {
    return status === 408 || status === 429 || status >= 500;
  }

  private resolveBackoffDelayMs(attempt: number, response?: Response) {
    const exponentialDelay = Math.min(
      this.retryMaxDelayMs,
      this.retryBaseDelayMs * 2 ** (attempt - 1),
    );
    const retryAfterDelay = this.readRetryAfterDelayMs(response);

    if (retryAfterDelay === null) {
      return exponentialDelay;
    }

    return Math.min(
      this.retryMaxDelayMs,
      Math.max(exponentialDelay, retryAfterDelay),
    );
  }

  private readRetryAfterDelayMs(response?: Response): number | null {
    if (!response?.headers?.get) {
      return null;
    }

    const header = response.headers.get('retry-after');

    if (!header) {
      return null;
    }

    const asSeconds = Number(header);
    if (Number.isFinite(asSeconds) && asSeconds >= 0) {
      return asSeconds * 1000;
    }

    const asDateMs = Date.parse(header);
    if (Number.isNaN(asDateMs)) {
      return null;
    }

    return Math.max(0, asDateMs - Date.now());
  }

  protected async sleep(delayMs: number) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
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

  private readPositiveIntEnv(envKey: string, fallback: number) {
    const value = Number(process.env[envKey]);
    if (!Number.isFinite(value) || value < 0) {
      return fallback;
    }

    return Math.floor(value);
  }
}
