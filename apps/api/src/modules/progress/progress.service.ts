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

  private calculateSuccessRatePercent(
    solvedPuzzles: number,
    totalPuzzles: number,
  ) {
    return Number(((solvedPuzzles / totalPuzzles) * 100).toFixed(1));
  }
}
