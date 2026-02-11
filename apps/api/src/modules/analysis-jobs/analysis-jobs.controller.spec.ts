import { BadRequestException } from '@nestjs/common';
import { AnalysisJobStatus } from '@prisma/client';
import { AnalysisJobsController } from './analysis-jobs.controller';

describe('AnalysisJobsController', () => {
  it('enqueues analysis jobs and returns snake_case summary', async () => {
    const enqueueFromImportedGames = jest.fn().mockResolvedValue({
      enqueued_count: 1,
      skipped_count: 0,
      jobs: [
        {
          job_id: 'analysis-1',
          game_id: 'game-1',
          status: AnalysisJobStatus.queued,
          queue_job_id: 'queue-1',
          created_at: '2026-02-11T00:00:00.000Z',
        },
      ],
    });

    const controller = new AnalysisJobsController({
      enqueueFromImportedGames,
      getJobStatus: jest.fn(),
    } as any);

    await expect(
      controller.enqueueAnalysisJobs(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          game_ids: ['game-1'],
        },
      ),
    ).resolves.toEqual({
      data: {
        enqueued_count: 1,
        skipped_count: 0,
        jobs: [
          {
            job_id: 'analysis-1',
            game_id: 'game-1',
            status: AnalysisJobStatus.queued,
            queue_job_id: 'queue-1',
            created_at: '2026-02-11T00:00:00.000Z',
          },
        ],
      },
    });

    expect(enqueueFromImportedGames).toHaveBeenCalledWith({
      user_id: 'local-user-1',
      game_ids: ['game-1'],
    });
  });

  it('rejects invalid game_ids payload', async () => {
    const controller = new AnalysisJobsController({
      enqueueFromImportedGames: jest.fn(),
      getJobStatus: jest.fn(),
    } as any);

    await expect(
      controller.enqueueAnalysisJobs(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        {
          game_ids: [123] as any,
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns analysis job status with progress and eta', async () => {
    const getJobStatus = jest.fn().mockResolvedValue({
      job_id: 'analysis-1',
      game_id: 'game-1',
      status: AnalysisJobStatus.running,
      progress_percent: 42,
      eta_seconds: 18,
      started_at: '2026-02-11T00:00:00.000Z',
      completed_at: null,
      error_code: null,
      error_message: null,
      updated_at: '2026-02-11T00:01:00.000Z',
    });

    const controller = new AnalysisJobsController({
      enqueueFromImportedGames: jest.fn(),
      getJobStatus,
    } as any);

    await expect(
      controller.getAnalysisJobStatus(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        'analysis-1',
      ),
    ).resolves.toEqual({
      data: {
        job_id: 'analysis-1',
        game_id: 'game-1',
        status: AnalysisJobStatus.running,
        progress_percent: 42,
        eta_seconds: 18,
        started_at: '2026-02-11T00:00:00.000Z',
        completed_at: null,
        error_code: null,
        error_message: null,
        updated_at: '2026-02-11T00:01:00.000Z',
      },
    });

    expect(getJobStatus).toHaveBeenCalledWith({
      user_id: 'local-user-1',
      job_id: 'analysis-1',
    });
  });

  it('rejects empty job_id for status lookup', async () => {
    const controller = new AnalysisJobsController({
      enqueueFromImportedGames: jest.fn(),
      getJobStatus: jest.fn(),
    } as any);

    await expect(
      controller.getAnalysisJobStatus(
        {
          local_user_id: 'local-user-1',
          supabase_sub: 'supabase-sub-1',
          email: 'leo@example.com',
          role: 'user',
        },
        '   ',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
