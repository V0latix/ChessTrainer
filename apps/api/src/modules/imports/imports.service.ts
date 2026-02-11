import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChessComService } from '../../integrations/chess-com/chess-com.service';

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
    const selectedUrls = Array.from(
      new Set(
        params.selected_game_urls.map((url) => url.trim()).filter(Boolean),
      ),
    );

    const recentGames = await this.chessComService.fetchRecentArchiveGames(
      params.username,
      params.archives_count,
    );

    const gamesByUrl = new Map(
      recentGames.games.map((game) => [game.game_url, game] as const),
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
          chessComUsername: recentGames.username,
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
      username: recentGames.username,
      selected_count: selectedUrls.length,
      imported_count: importedCount,
      already_existing_count: alreadyExistingCount,
      failed_count: failedCount,
      failures,
    };
  }
}
