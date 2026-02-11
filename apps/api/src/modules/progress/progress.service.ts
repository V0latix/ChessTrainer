import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type RecordPuzzleSessionResult = {
  session_id: string;
  total_puzzles: number;
  solved_puzzles: number;
  skipped_puzzles: number;
  success_rate_percent: number;
  created_at: string;
};

export type ProgressSummaryResult = {
  generated_at: string;
  sessions_completed: number;
  puzzles_completed: number;
  puzzles_solved: number;
  puzzles_skipped: number;
  success_rate_percent: number | null;
  last_session_at: string | null;
  recent_mistakes: Array<{
    category: string;
    mistake_count: number;
    average_eval_drop_cp: number;
    updated_at: string;
  }>;
};

export type ProgressTrendsResult = {
  generated_at: string;
  window_days: number;
  compared_to_days: number;
  categories: Array<{
    category: string;
    recent_count: number;
    previous_count: number;
    delta_count: number;
    trend_direction: 'up' | 'down' | 'stable' | 'new';
    average_eval_drop_cp: number;
  }>;
};

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async recordPuzzleSession(params: {
    user_id: string;
    total_puzzles: number;
    solved_puzzles: number;
    skipped_puzzles: number;
  }): Promise<RecordPuzzleSessionResult> {
    const created = await this.prisma.puzzleSession.create({
      data: {
        userId: params.user_id,
        totalPuzzles: params.total_puzzles,
        solvedPuzzles: params.solved_puzzles,
        skippedPuzzles: params.skipped_puzzles,
      },
      select: {
        id: true,
        totalPuzzles: true,
        solvedPuzzles: true,
        skippedPuzzles: true,
        createdAt: true,
      },
    });

    return {
      session_id: created.id,
      total_puzzles: created.totalPuzzles,
      solved_puzzles: created.solvedPuzzles,
      skipped_puzzles: created.skippedPuzzles,
      success_rate_percent: this.calculateSuccessRatePercent(
        created.solvedPuzzles,
        created.totalPuzzles,
      ),
      created_at: created.createdAt.toISOString(),
    };
  }

  async getSummary(params: {
    user_id: string;
  }): Promise<ProgressSummaryResult> {
    const [aggregate, lastSession, recentMistakes] = await Promise.all([
      this.prisma.puzzleSession.aggregate({
        where: { userId: params.user_id },
        _count: {
          _all: true,
        },
        _sum: {
          totalPuzzles: true,
          solvedPuzzles: true,
          skippedPuzzles: true,
        },
      }),
      this.prisma.puzzleSession.findFirst({
        where: { userId: params.user_id },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      }),
      this.prisma.userMistakeSummary.findMany({
        where: {
          userId: params.user_id,
        },
        orderBy: {
          mistakeCount: 'desc',
        },
        take: 5,
        select: {
          category: true,
          mistakeCount: true,
          averageEvalDropCp: true,
          updatedAt: true,
        },
      }),
    ]);

    const puzzlesCompleted = aggregate._sum.totalPuzzles ?? 0;
    const puzzlesSolved = aggregate._sum.solvedPuzzles ?? 0;
    const puzzlesSkipped = aggregate._sum.skippedPuzzles ?? 0;

    return {
      generated_at: new Date().toISOString(),
      sessions_completed: aggregate._count._all,
      puzzles_completed: puzzlesCompleted,
      puzzles_solved: puzzlesSolved,
      puzzles_skipped: puzzlesSkipped,
      success_rate_percent:
        puzzlesCompleted > 0
          ? this.calculateSuccessRatePercent(puzzlesSolved, puzzlesCompleted)
          : null,
      last_session_at: lastSession ? lastSession.createdAt.toISOString() : null,
      recent_mistakes: recentMistakes.map((item) => ({
        category: item.category,
        mistake_count: item.mistakeCount,
        average_eval_drop_cp: item.averageEvalDropCp,
        updated_at: item.updatedAt.toISOString(),
      })),
    };
  }

  async getTrends(params: {
    user_id: string;
    window_days: number;
    limit: number;
  }): Promise<ProgressTrendsResult> {
    const now = new Date();
    const recentStart = new Date(
      now.getTime() - params.window_days * 24 * 60 * 60 * 1000,
    );
    const previousStart = new Date(
      recentStart.getTime() - params.window_days * 24 * 60 * 60 * 1000,
    );

    const [recentByCategory, previousByCategory] = await Promise.all([
      this.prisma.criticalMistake.groupBy({
        by: ['category'],
        where: {
          userId: params.user_id,
          createdAt: {
            gte: recentStart,
          },
        },
        _count: {
          _all: true,
        },
        _avg: {
          evalDropCp: true,
        },
      }),
      this.prisma.criticalMistake.groupBy({
        by: ['category'],
        where: {
          userId: params.user_id,
          createdAt: {
            gte: previousStart,
            lt: recentStart,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const previousCountByCategory = new Map(
      previousByCategory.map((item) => [item.category, item._count._all]),
    );

    const ranked = recentByCategory
      .map((item) => {
        const recentCount = item._count._all;
        const previousCount = previousCountByCategory.get(item.category) ?? 0;
        const delta = recentCount - previousCount;

        return {
          category: item.category,
          recent_count: recentCount,
          previous_count: previousCount,
          delta_count: delta,
          trend_direction: this.resolveTrendDirection(
            recentCount,
            previousCount,
          ),
          average_eval_drop_cp: Math.round(item._avg.evalDropCp ?? 0),
        };
      })
      .sort((a, b) => {
        if (b.recent_count !== a.recent_count) {
          return b.recent_count - a.recent_count;
        }

        if (b.delta_count !== a.delta_count) {
          return b.delta_count - a.delta_count;
        }

        return a.category.localeCompare(b.category);
      })
      .slice(0, params.limit);

    return {
      generated_at: now.toISOString(),
      window_days: params.window_days,
      compared_to_days: params.window_days,
      categories: ranked,
    };
  }

  private calculateSuccessRatePercent(
    solvedPuzzles: number,
    totalPuzzles: number,
  ) {
    return Number(((solvedPuzzles / totalPuzzles) * 100).toFixed(1));
  }

  private resolveTrendDirection(
    recentCount: number,
    previousCount: number,
  ): 'up' | 'down' | 'stable' | 'new' {
    if (previousCount === 0 && recentCount > 0) {
      return 'new';
    }

    if (recentCount > previousCount) {
      return 'up';
    }

    if (recentCount < previousCount) {
      return 'down';
    }

    return 'stable';
  }
}
