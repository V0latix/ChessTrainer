import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

export type AnalysisJobStatusResult = {
  job_id: string;
  game_id: string;
  status: AnalysisJobStatus;
  progress_percent: number;
  eta_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
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

  async getJobStatus(params: {
    user_id: string;
    job_id: string;
  }): Promise<AnalysisJobStatusResult> {
    const job = await this.prisma.analysisJob.findFirst({
      where: {
        id: params.job_id,
        userId: params.user_id,
      },
      select: {
        id: true,
        gameId: true,
        status: true,
        progressPercent: true,
        etaSeconds: true,
        startedAt: true,
        completedAt: true,
        errorCode: true,
        errorMessage: true,
        updatedAt: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Analysis job not found.');
    }

    return {
      job_id: job.id,
      game_id: job.gameId,
      status: job.status,
      progress_percent: job.progressPercent,
      eta_seconds: job.etaSeconds,
      started_at: job.startedAt ? job.startedAt.toISOString() : null,
      completed_at: job.completedAt ? job.completedAt.toISOString() : null,
      error_code: job.errorCode,
      error_message: job.errorMessage,
      updated_at: job.updatedAt.toISOString(),
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
