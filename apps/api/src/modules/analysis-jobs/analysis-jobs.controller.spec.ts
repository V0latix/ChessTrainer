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
});
