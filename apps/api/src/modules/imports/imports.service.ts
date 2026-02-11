import { Injectable } from '@nestjs/common';
import type { RecentArchiveGame } from '../../integrations/chess-com/chess-com.service';
import { ChessComService } from '../../integrations/chess-com/chess-com.service';
import { PrismaService } from '../../prisma/prisma.service';

export type ImportSelectedGamesResult = {
  username: string;
  selected_count: number;
  imported_count: number;
  already_existing_count: number;
  failed_count: number;
  failures: Array<{
    game_url: string;
    reason: string;
  }>;
};

export type ReimportGamesResult = {
  username: string;
  scanned_count: number;
  imported_count: number;
  already_existing_count: number;
  failed_count: number;
  failures: Array<{
    game_url: string;
    reason: string;
  }>;
  unavailable_periods: Array<{
    period: string;
    archive_url: string;
    reason: string;
  }>;
};

@Injectable()
export class ImportsService {
  constructor(
    private readonly chessComService: ChessComService,
    private readonly prisma: PrismaService,
  ) {}

  async listCandidateGames(username: string, archivesCount?: number) {
    return this.chessComService.listCandidateGames(username, archivesCount);
  }

  async importSelectedGames(params: {
    user_id: string;
    username: string;
    selected_game_urls: string[];
    archives_count?: number;
  }): Promise<ImportSelectedGamesResult> {
    const recentGames = await this.chessComService.fetchRecentArchiveGames(
      params.username,
      params.archives_count,
    );

    const persistence = await this.persistSelectedGames({
      user_id: params.user_id,
      username: recentGames.username,
      selected_game_urls: params.selected_game_urls,
      games: recentGames.games,
    });

    return {
      username: recentGames.username,
      selected_count: persistence.selected_count,
      imported_count: persistence.imported_count,
      already_existing_count: persistence.already_existing_count,
      failed_count: persistence.failed_count,
      failures: persistence.failures,
    };
  }

  async reimportIncrementally(params: {
    user_id: string;
    username: string;
    archives_count?: number;
  }): Promise<ReimportGamesResult> {
    const recentGames = await this.chessComService.fetchRecentArchiveGames(
      params.username,
      params.archives_count,
    );

    const selectedUrls = recentGames.games.map((game) => game.game_url);

    const persistence = await this.persistSelectedGames({
      user_id: params.user_id,
      username: recentGames.username,
      selected_game_urls: selectedUrls,
      games: recentGames.games,
    });

    return {
      username: recentGames.username,
      scanned_count: selectedUrls.length,
      imported_count: persistence.imported_count,
      already_existing_count: persistence.already_existing_count,
      failed_count: persistence.failed_count,
      failures: persistence.failures,
      unavailable_periods: recentGames.unavailable_periods,
    };
  }

  private async persistSelectedGames(params: {
    user_id: string;
    username: string;
    selected_game_urls: string[];
    games: RecentArchiveGame[];
  }) {
    const selectedUrls = Array.from(
      new Set(
        params.selected_game_urls.map((url) => url.trim()).filter(Boolean),
      ),
    );

    const gamesByUrl = new Map(
      params.games.map((game) => [game.game_url, game] as const),
    );

    let importedCount = 0;
    let alreadyExistingCount = 0;
    let failedCount = 0;
    const failures: Array<{ game_url: string; reason: string }> = [];

    for (const selectedGameUrl of selectedUrls) {
      const game = gamesByUrl.get(selectedGameUrl);

      if (!game) {
        failedCount += 1;
        failures.push({
          game_url: selectedGameUrl,
          reason: 'not_found_in_recent_archives',
        });
        continue;
      }

      const existing = await this.prisma.game.findUnique({
        where: {
          userId_gameUrl: {
            userId: params.user_id,
            gameUrl: game.game_url,
          },
        },
      });

      if (existing) {
        alreadyExistingCount += 1;
        continue;
      }

      await this.prisma.game.create({
        data: {
          userId: params.user_id,
          provider: 'chess_com',
          gameUrl: game.game_url,
          chessComUsername: params.username,
          period: game.period,
          pgn: game.pgn,
          endTime: game.end_time ? new Date(game.end_time) : null,
          timeClass: game.time_class,
          rated: game.rated,
          rules: game.rules,
        },
      });

      importedCount += 1;
    }

    return {
      selected_count: selectedUrls.length,
      imported_count: importedCount,
      already_existing_count: alreadyExistingCount,
      failed_count: failedCount,
      failures,
    };
  }
}
