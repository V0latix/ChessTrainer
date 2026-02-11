import { AnalysisJobStatus } from '@prisma/client';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { AnalysisJobsController } from '../modules/analysis-jobs/analysis-jobs.controller';
import { AuthController } from '../modules/auth/auth.controller';
import { ImportsController } from '../modules/imports/imports.controller';
import { PuzzlesController } from '../modules/puzzles/puzzles.controller';
import { ProgressController } from '../modules/progress/progress.controller';

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

  it('enforces snake_case keys for puzzle payloads', async () => {
    const controller = new PuzzlesController({
      getNextPuzzle: jest.fn().mockResolvedValue({
        puzzle_id: 'mistake-1',
        source: 'critical_mistake',
        fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
        side_to_move: 'black',
        objective:
          'Trouve le meilleur coup pour les noirs dans cette position.',
        context: {
          game_id: 'game-1',
          game_url: 'https://www.chess.com/game/live/123',
          chess_com_username: 'leo',
          period: '2026-02',
          time_class: 'rapid',
          phase: 'endgame',
          severity: 'blunder',
          category: 'endgame_blunder',
          played_move_uci: 'h1h2',
          best_move_uci: 'h1g1',
          eval_drop_cp: 540,
          ply_index: 60,
          created_at: '2026-02-11T00:00:00.000Z',
        },
      }),
      getPuzzleSession: jest.fn().mockResolvedValue({
        session_id: 'user-1:mistake-1',
        generated_at: '2026-02-11T00:00:00.000Z',
        total_puzzles: 1,
        puzzles: [
          {
            puzzle_id: 'mistake-1',
            source: 'critical_mistake',
            fen: '8/8/8/8/8/8/8/K6k b - - 0 1',
            side_to_move: 'black',
            objective:
              'Trouve le meilleur coup pour les noirs dans cette position.',
            context: {
              game_id: 'game-1',
              game_url: 'https://www.chess.com/game/live/123',
              chess_com_username: 'leo',
              period: '2026-02',
              time_class: 'rapid',
              phase: 'endgame',
              severity: 'blunder',
              category: 'endgame_blunder',
              played_move_uci: 'h1h2',
              best_move_uci: 'h1g1',
              eval_drop_cp: 540,
              ply_index: 60,
              created_at: '2026-02-11T00:00:00.000Z',
            },
          },
        ],
      }),
      evaluateAttempt: jest.fn().mockResolvedValue({
        puzzle_id: 'mistake-1',
        attempted_move_uci: 'h1h2',
        best_move_uci: 'h1g1',
        is_correct: false,
        status: 'incorrect',
        feedback_title: 'Presque',
        feedback_message: 'Ce n’est pas le meilleur coup. Essaie encore: h1g1.',
        wrong_move_explanation:
          'Le coup h1h2 en endgame (blunder) laisse passer une idée clé et coûte environ 540 centipawns.',
        best_move_explanation:
          "Le coup h1g1 est meilleur car il améliore l'activité du roi et la coordination des pions. C’est la ressource la plus solide contre une erreur de type blunder.",
        retry_available: true,
      }),
    } as any);

    const puzzleResult = await controller.getNextPuzzle({
      local_user_id: 'user-1',
      supabase_sub: 'sub-1',
      email: 'leo@example.com',
      role: 'user',
    });

    expectSnakeCaseKeys(puzzleResult);

    const sessionResult = await controller.getPuzzleSession(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      '5',
    );

    expectSnakeCaseKeys(sessionResult);

    const attemptResult = await controller.evaluatePuzzleAttempt(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      'mistake-1',
      {
        attempted_move_uci: 'h1h2',
      },
    );

    expectSnakeCaseKeys(attemptResult);
  });

  it('enforces snake_case keys for progress payloads', async () => {
    const controller = new ProgressController({
      getSummary: jest.fn().mockResolvedValue({
        generated_at: '2026-02-11T00:00:00.000Z',
        sessions_completed: 2,
        puzzles_completed: 15,
        puzzles_solved: 10,
        puzzles_skipped: 5,
        success_rate_percent: 66.7,
        last_session_at: '2026-02-10T00:00:00.000Z',
        recent_mistakes: [
          {
            category: 'endgame_blunder',
            mistake_count: 7,
            average_eval_drop_cp: 320,
            updated_at: '2026-02-11T00:00:00.000Z',
          },
        ],
      }),
      getTrends: jest.fn().mockResolvedValue({
        generated_at: '2026-02-11T00:00:00.000Z',
        window_days: 14,
        compared_to_days: 14,
        categories: [
          {
            category: 'endgame_blunder',
            recent_count: 7,
            previous_count: 5,
            delta_count: 2,
            trend_direction: 'up',
            average_eval_drop_cp: 320,
          },
        ],
      }),
      recordPuzzleSession: jest.fn().mockResolvedValue({
        session_id: 'session-1',
        total_puzzles: 10,
        solved_puzzles: 6,
        skipped_puzzles: 4,
        success_rate_percent: 60,
        created_at: '2026-02-11T00:00:00.000Z',
      }),
    } as any);

    const summaryResult = await controller.getSummary({
      local_user_id: 'user-1',
      supabase_sub: 'sub-1',
      email: 'leo@example.com',
      role: 'user',
    });
    expectSnakeCaseKeys(summaryResult);

    const trendsResult = await controller.getTrends(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      '14',
      '8',
    );
    expectSnakeCaseKeys(trendsResult);

    const recordResult = await controller.recordPuzzleSession(
      {
        local_user_id: 'user-1',
        supabase_sub: 'sub-1',
        email: 'leo@example.com',
        role: 'user',
      },
      {
        total_puzzles: 10,
        solved_puzzles: 6,
        skipped_puzzles: 4,
      },
    );
    expectSnakeCaseKeys(recordResult);
  });
});
