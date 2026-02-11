import { BadRequestException, Injectable } from '@nestjs/common';
import { AnalysisJobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalysisQueueService } from '../../queue/analysis-queue.service';

export type EnqueueAnalysisJobsResult = {
  enqueued_count: number;
  skipped_count: number;
  jobs: Array<{
    job_id: string;
    game_id: string;
    status: AnalysisJobStatus;
    queue_job_id: string;
    created_at: string;
  }>;
};

@Injectable()
export class AnalysisJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisQueue: AnalysisQueueService,
  ) {}

  async enqueueFromImportedGames(params: {
    user_id: string;
    game_ids?: string[];
  }): Promise<EnqueueAnalysisJobsResult> {
    const selectedGameIds = this.normalizeIds(params.game_ids);
    const gameFilter =
      selectedGameIds.length > 0 ? { id: { in: selectedGameIds } } : undefined;

    const games = await this.prisma.game.findMany({
      where: {
        userId: params.user_id,
        ...(gameFilter ? gameFilter : {}),
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (games.length === 0) {
      throw new BadRequestException('No imported games found to enqueue.');
    }

    const activeJobs = await this.prisma.analysisJob.findMany({
      where: {
        userId: params.user_id,
        gameId: {
          in: games.map((game) => game.id),
        },
        status: {
          in: [AnalysisJobStatus.queued, AnalysisJobStatus.running],
        },
      },
      select: {
        gameId: true,
      },
    });

    const activeGameIds = new Set(activeJobs.map((job) => job.gameId));
    const jobs: EnqueueAnalysisJobsResult['jobs'] = [];

    for (const game of games) {
      if (activeGameIds.has(game.id)) {
        continue;
      }

      const queue = await this.analysisQueue.enqueueAnalysis({
        user_id: params.user_id,
        game_id: game.id,
      });

      const created = await this.prisma.analysisJob.create({
        data: {
          userId: params.user_id,
          gameId: game.id,
          status: AnalysisJobStatus.queued,
          queueJobId: queue.queue_job_id,
          progressPercent: 0,
        },
      });

      jobs.push({
        job_id: created.id,
        game_id: created.gameId,
        status: created.status,
        queue_job_id: created.queueJobId,
        created_at: created.createdAt.toISOString(),
      });
    }

    return {
      enqueued_count: jobs.length,
      skipped_count: games.length - jobs.length,
      jobs,
    };
  }

  private normalizeIds(gameIds?: string[]) {
    if (!gameIds) {
      return [];
    }

    return Array.from(
      new Set(gameIds.map((gameId) => gameId.trim()).filter(Boolean)),
    );
  }
}
