import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DataInventoryResult = {
  generated_at: string;
  counts: {
    games_count: number;
    analyses_count: number;
    move_evaluations_count: number;
    critical_mistakes_count: number;
    puzzle_sessions_count: number;
  };
  latest_updates: {
    last_game_import: {
      game_id: string;
      game_url: string;
      chess_com_username: string;
      period: string;
      imported_at: string;
    } | null;
    last_analysis_update: {
      job_id: string;
      game_id: string;
      status: string;
      updated_at: string;
      completed_at: string | null;
    } | null;
    last_mistake_update: {
      mistake_id: string;
      game_id: string;
      category: string;
      updated_at: string;
    } | null;
  };
};

@Injectable()
export class DataInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventory(params: {
    user_id: string;
  }): Promise<DataInventoryResult> {
    const [
      gamesCount,
      analysesCount,
      moveEvaluationsCount,
      criticalMistakesCount,
      puzzleSessionsCount,
      lastGameImport,
      lastAnalysisUpdate,
      lastMistakeUpdate,
    ] = await Promise.all([
      this.prisma.game.count({
        where: {
          userId: params.user_id,
        },
      }),
      this.prisma.analysisJob.count({
        where: {
          userId: params.user_id,
        },
      }),
      this.prisma.analysisMoveEvaluation.count({
        where: {
          analysisJob: {
            userId: params.user_id,
          },
        },
      }),
      this.prisma.criticalMistake.count({
        where: {
          userId: params.user_id,
        },
      }),
      this.prisma.puzzleSession.count({
        where: {
          userId: params.user_id,
        },
      }),
      this.prisma.game.findFirst({
        where: {
          userId: params.user_id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          gameUrl: true,
          chessComUsername: true,
          period: true,
          createdAt: true,
        },
      }),
      this.prisma.analysisJob.findFirst({
        where: {
          userId: params.user_id,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          gameId: true,
          status: true,
          updatedAt: true,
          completedAt: true,
        },
      }),
      this.prisma.criticalMistake.findFirst({
        where: {
          userId: params.user_id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          gameId: true,
          category: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      generated_at: new Date().toISOString(),
      counts: {
        games_count: gamesCount,
        analyses_count: analysesCount,
        move_evaluations_count: moveEvaluationsCount,
        critical_mistakes_count: criticalMistakesCount,
        puzzle_sessions_count: puzzleSessionsCount,
      },
      latest_updates: {
        last_game_import: lastGameImport
          ? {
              game_id: lastGameImport.id,
              game_url: lastGameImport.gameUrl,
              chess_com_username: lastGameImport.chessComUsername,
              period: lastGameImport.period,
              imported_at: lastGameImport.createdAt.toISOString(),
            }
          : null,
        last_analysis_update: lastAnalysisUpdate
          ? {
              job_id: lastAnalysisUpdate.id,
              game_id: lastAnalysisUpdate.gameId,
              status: lastAnalysisUpdate.status,
              updated_at: lastAnalysisUpdate.updatedAt.toISOString(),
              completed_at: lastAnalysisUpdate.completedAt
                ? lastAnalysisUpdate.completedAt.toISOString()
                : null,
            }
          : null,
        last_mistake_update: lastMistakeUpdate
          ? {
              mistake_id: lastMistakeUpdate.id,
              game_id: lastMistakeUpdate.gameId,
              category: lastMistakeUpdate.category,
              updated_at: lastMistakeUpdate.createdAt.toISOString(),
            }
          : null,
      },
    };
  }
}
