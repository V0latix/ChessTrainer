import { AnalysisJobStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { AnalysisJobsService } from './analysis-jobs.service';

describe('AnalysisJobsService', () => {
  it('enqueues one analysis job per imported game and returns job tracking ids', async () => {
    const queueJobIds = ['queue-1', 'queue-2'];
    const enqueueAnalysis = jest
      .fn()
      .mockResolvedValueOnce({ queue_job_id: queueJobIds[0] })
      .mockResolvedValueOnce({ queue_job_id: queueJobIds[1] });

    const create = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'analysis-1',
        gameId: 'game-1',
        status: AnalysisJobStatus.queued,
        queueJobId: queueJobIds[0],
        createdAt: new Date('2026-02-11T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'analysis-2',
        gameId: 'game-2',
        status: AnalysisJobStatus.queued,
        queueJobId: queueJobIds[1],
        createdAt: new Date('2026-02-11T00:01:00.000Z'),
      });

    const service = new AnalysisJobsService(
      {
        game: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 'game-1' }, { id: 'game-2' }]),
        },
        analysisJob: {
          findMany: jest.fn().mockResolvedValue([]),
          create,
        },
      } as any,
      {
        enqueueAnalysis,
      } as any,
    );

    const result = await service.enqueueFromImportedGames({
      user_id: 'local-user-1',
    });

    expect(result).toEqual({
      enqueued_count: 2,
      skipped_count: 0,
      jobs: [
        {
          job_id: 'analysis-1',
          game_id: 'game-1',
          status: AnalysisJobStatus.queued,
          queue_job_id: queueJobIds[0],
          created_at: '2026-02-11T00:00:00.000Z',
        },
        {
          job_id: 'analysis-2',
          game_id: 'game-2',
          status: AnalysisJobStatus.queued,
          queue_job_id: queueJobIds[1],
          created_at: '2026-02-11T00:01:00.000Z',
        },
      ],
    });

    expect(enqueueAnalysis).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(1, {
      data: {
        userId: 'local-user-1',
        gameId: 'game-1',
        status: AnalysisJobStatus.queued,
        queueJobId: queueJobIds[0],
        progressPercent: 0,
      },
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      data: {
        userId: 'local-user-1',
        gameId: 'game-2',
        status: AnalysisJobStatus.queued,
        queueJobId: queueJobIds[1],
        progressPercent: 0,
      },
    });
  });

  it('skips games that already have active queued/running jobs', async () => {
    const service = new AnalysisJobsService(
      {
        game: {
          findMany: jest
            .fn()
            .mockResolvedValue([{ id: 'game-1' }, { id: 'game-2' }]),
        },
        analysisJob: {
          findMany: jest.fn().mockResolvedValue([{ gameId: 'game-1' }]),
          create: jest.fn().mockResolvedValue({
            id: 'analysis-2',
            gameId: 'game-2',
            status: AnalysisJobStatus.queued,
            queueJobId: 'queue-2',
            createdAt: new Date('2026-02-11T00:01:00.000Z'),
          }),
        },
      } as any,
      {
        enqueueAnalysis: jest
          .fn()
          .mockResolvedValue({ queue_job_id: 'queue-2' }),
      } as any,
    );

    const result = await service.enqueueFromImportedGames({
      user_id: 'local-user-1',
    });

    expect(result.enqueued_count).toBe(1);
    expect(result.skipped_count).toBe(1);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].game_id).toBe('game-2');
  });

  it('throws when no imported games are found', async () => {
    const service = new AnalysisJobsService(
      {
        game: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        analysisJob: {
          findMany: jest.fn(),
          create: jest.fn(),
        },
      } as any,
      {
        enqueueAnalysis: jest.fn(),
      } as any,
    );

    await expect(
      service.enqueueFromImportedGames({
        user_id: 'local-user-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
