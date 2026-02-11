import { AnalysisJobStatus } from '@prisma/client';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { AnalysisJobsController } from '../modules/analysis-jobs/analysis-jobs.controller';
import { AuthController } from '../modules/auth/auth.controller';
import { ImportsController } from '../modules/imports/imports.controller';

const SNAKE_CASE_KEY = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

function expectSnakeCaseKeys(value: unknown, path = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      expectSnakeCaseKeys(item, `${path}[${index}]`);
    });
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    expect(key).toMatch(SNAKE_CASE_KEY);
    expectSnakeCaseKeys(child, `${path}.${key}`);
  }
}

describe('API snake_case contract', () => {
  it('enforces snake_case keys for root + health payloads', () => {
    const controller = new AppController(new AppService());

    expectSnakeCaseKeys(controller.getRoot());
    expectSnakeCaseKeys(controller.getHealth());
  });

  it('enforces snake_case keys for auth payloads', async () => {
    const controller = new AuthController(
      {
        deleteAccount: jest.fn().mockResolvedValue(undefined),
      } as any,
      {
        logSensitiveAction: jest.fn().mockResolvedValue(undefined),
        listActorAuditLogs: jest.fn().mockResolvedValue([
          {
            id: 'audit-1',
            actor_user_id: 'user-1',
            actor_supabase_sub: 'sub-1',
            action: 'login',
            trace_id: 'trace-1',
            metadata: null,
            created_at: '2026-02-11T00:00:00.000Z',
          },
        ]),
      } as any,
    );

    const me = await controller.getCurrentUser(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      { traceId: 'trace-1' } as any,
    );
    expectSnakeCaseKeys(me);

    const deletion = await controller.deleteAccount(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      { confirm_deletion: true },
      { traceId: 'trace-1' } as any,
    );
    expectSnakeCaseKeys(deletion);

    const logs = await controller.getAuditLogs(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      '50',
    );
    expectSnakeCaseKeys(logs);
  });

  it('enforces snake_case keys for import payloads', async () => {
    const controller = new ImportsController({
      listCandidateGames: jest.fn().mockResolvedValue({
        username: 'leo',
        candidate_games: [
          {
            game_url: 'https://www.chess.com/game/live/123',
            period: '2026-02',
            end_time: '2026-02-11T00:00:00.000Z',
            time_class: 'blitz',
            rated: true,
            rules: 'chess',
            white_username: 'leo',
            black_username: 'maxime',
            white_result: 'win',
            black_result: 'checkmated',
            selectable: true,
          },
        ],
        unavailable_periods: [],
      }),
      importSelectedGames: jest.fn().mockResolvedValue({
        username: 'leo',
        selected_count: 1,
        imported_count: 1,
        already_existing_count: 0,
        failed_count: 0,
        failures: [],
      }),
      reimportIncrementally: jest.fn().mockResolvedValue({
        username: 'leo',
        scanned_count: 1,
        imported_count: 1,
        already_existing_count: 0,
        failed_count: 0,
        failures: [],
        unavailable_periods: [],
      }),
    } as any);

    const candidates = await controller.getChessComCandidateGames('leo', '2');
    expectSnakeCaseKeys(candidates);

    const imported = await controller.importSelectedChessComGames(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      {
        username: 'leo',
        selected_game_urls: ['https://www.chess.com/game/live/123'],
      },
    );
    expectSnakeCaseKeys(imported);

    const reimported = await controller.reimportChessComGames(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      { username: 'leo' },
    );
    expectSnakeCaseKeys(reimported);
  });

  it('enforces snake_case keys for analysis payloads', async () => {
    const controller = new AnalysisJobsController({
      enqueueFromImportedGames: jest.fn().mockResolvedValue({
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
      }),
      getJobStatus: jest.fn().mockResolvedValue({
        job_id: 'analysis-1',
        game_id: 'game-1',
        status: AnalysisJobStatus.running,
        progress_percent: 42,
        eta_seconds: 18,
        started_at: '2026-02-11T00:00:00.000Z',
        completed_at: null,
        error_code: null,
        error_message: null,
        updated_at: '2026-02-11T00:00:30.000Z',
      }),
    } as any);

    const enqueueResult = await controller.enqueueAnalysisJobs(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      {},
    );
    expectSnakeCaseKeys(enqueueResult);

    const statusResult = await controller.getAnalysisJobStatus(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      'analysis-1',
    );
    expectSnakeCaseKeys(statusResult);
  });
});
