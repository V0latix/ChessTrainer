import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

export type DeletableDataset = 'games' | 'analyses' | 'puzzle_sessions';

export type DataDeletionResult = {
  deleted_datasets: DeletableDataset[];
  deleted_counts: {
    games_count: number;
    analyses_count: number;
    move_evaluations_count: number;
    critical_mistakes_count: number;
    puzzle_sessions_count: number;
    user_mistake_summaries_count: number;
  };
  remaining_counts: {
    games_count: number;
    analyses_count: number;
    move_evaluations_count: number;
    critical_mistakes_count: number;
    puzzle_sessions_count: number;
  };
  deleted_at: string;
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

  async deleteDatasets(params: {
    user_id: string;
    dataset_keys: DeletableDataset[];
  }): Promise<DataDeletionResult> {
    const datasetKeys = Array.from(new Set(params.dataset_keys));

    return this.prisma.$transaction(async (tx) => {
      const beforeCounts = await this.getCounts(tx, params.user_id);
      const beforeSummaries = await tx.userMistakeSummary.count({
        where: {
          userId: params.user_id,
        },
      });

      if (datasetKeys.includes('games')) {
        await tx.game.deleteMany({
          where: {
            userId: params.user_id,
          },
        });
      }

      if (datasetKeys.includes('analyses')) {
        await tx.analysisJob.deleteMany({
          where: {
            userId: params.user_id,
          },
        });
      }

      if (datasetKeys.includes('puzzle_sessions')) {
        await tx.puzzleSession.deleteMany({
          where: {
            userId: params.user_id,
          },
        });
      }

      const shouldClearSummaries =
        datasetKeys.includes('games') || datasetKeys.includes('analyses');

      if (shouldClearSummaries) {
        await tx.userMistakeSummary.deleteMany({
          where: {
            userId: params.user_id,
          },
        });
      }

      const afterCounts = await this.getCounts(tx, params.user_id);
      const afterSummaries = shouldClearSummaries
        ? 0
        : await tx.userMistakeSummary.count({
            where: {
              userId: params.user_id,
            },
          });

      return {
        deleted_datasets: datasetKeys,
        deleted_counts: {
          games_count: beforeCounts.games_count - afterCounts.games_count,
          analyses_count:
            beforeCounts.analyses_count - afterCounts.analyses_count,
          move_evaluations_count:
            beforeCounts.move_evaluations_count -
            afterCounts.move_evaluations_count,
          critical_mistakes_count:
            beforeCounts.critical_mistakes_count -
            afterCounts.critical_mistakes_count,
          puzzle_sessions_count:
            beforeCounts.puzzle_sessions_count -
            afterCounts.puzzle_sessions_count,
          user_mistake_summaries_count: beforeSummaries - afterSummaries,
        },
        remaining_counts: afterCounts,
        deleted_at: new Date().toISOString(),
      };
    });
  }

  private async getCounts(tx: Prisma.TransactionClient, userId: string) {
    const [
      gamesCount,
      analysesCount,
      moveEvaluationsCount,
      criticalMistakesCount,
      puzzleSessionsCount,
    ] = await Promise.all([
      tx.game.count({
        where: {
          userId,
        },
      }),
      tx.analysisJob.count({
        where: {
          userId,
        },
      }),
      tx.analysisMoveEvaluation.count({
        where: {
          analysisJob: {
            userId,
          },
        },
      }),
      tx.criticalMistake.count({
        where: {
          userId,
        },
      }),
      tx.puzzleSession.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      games_count: gamesCount,
      analyses_count: analysesCount,
      move_evaluations_count: moveEvaluationsCount,
      critical_mistakes_count: criticalMistakesCount,
      puzzle_sessions_count: puzzleSessionsCount,
    };
  }
}
