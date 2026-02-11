import { PrismaClient } from '@prisma/client';
import { Chess } from 'chess.js';
import type { WorkerConfig } from '../config.js';
import { logError, logInfo } from '../observability/logger.js';
import { captureWorkerException } from '../observability/sentry.js';
import { StockfishAnalysisError, StockfishService } from './stockfish.service.js';

type QueuedJob = {
  id: string;
};

type EvaluatedPly = {
  plyIndex: number;
  fen: string;
  playedMoveUci: string;
  bestMoveUci: string | null;
  scoreCp: number | null;
  scoreMateIn: number | null;
};

type CriticalMistakeRow = {
  plyIndex: number;
  fen: string;
  playedMoveUci: string;
  bestMoveUci: string;
  evalDropCp: number;
  phase: string;
  severity: string;
  category: string;
};

export class AnalysisWorkerService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stockfish: StockfishService,
    private readonly config: WorkerConfig,
  ) {}

  async runOnce(): Promise<{ processed: number }> {
    const queuedJobs = await this.prisma.analysisJob.findMany({
      where: {
        status: 'queued',
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: this.config.batchSize,
    });

    let processed = 0;
    for (const job of queuedJobs) {
      const didProcess = await this.processJob(job);
      if (didProcess) {
        processed += 1;
      }
    }

    return { processed };
  }

  private async processJob(job: QueuedJob) {
    logInfo({
      event: 'analysis_job_lock_attempt',
      analysis_job_id: job.id,
    });

    const lockResult = await this.prisma.analysisJob.updateMany({
      where: {
        id: job.id,
        status: 'queued',
      },
      data: {
        status: 'running',
        startedAt: new Date(),
        completedAt: null,
        progressPercent: 0,
        etaSeconds: null,
        errorCode: null,
        errorMessage: null,
      },
    });

    if (lockResult.count === 0) {
      logInfo({
        event: 'analysis_job_lock_skipped',
        analysis_job_id: job.id,
      });
      return false;
    }

    const maxAttempts = this.config.analysisRetryMaxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: { attemptCount: attempt },
        });

        const executionResult = await this.executeSingleAttempt(job.id);

        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            progressPercent: 100,
            etaSeconds: 0,
            errorCode: null,
            errorMessage: null,
          },
        });

        logInfo({
          event: 'analysis_job_completed',
          analysis_job_id: job.id,
          attempts: attempt,
        });
        await this.refreshRecentSummaries(executionResult.userId);

        return true;
      } catch (error) {
        const isTransient = this.isTransientError(error);

        if (isTransient && attempt < maxAttempts) {
          const backoffDelayMs = this.resolveBackoffDelayMs(attempt);
          logInfo({
            event: 'analysis_job_retry_scheduled',
            analysis_job_id: job.id,
            attempt,
            max_attempts: maxAttempts,
            backoff_delay_ms: backoffDelayMs,
          });
          await this.sleep(backoffDelayMs);
          continue;
        }

        const reason =
          error instanceof Error ? error.message : 'Unknown analysis worker failure.';
        const code = this.resolveErrorCode(error);

        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errorCode: code,
            errorMessage: reason,
          },
        });

        logError({
          event: 'analysis_job_failed',
          analysis_job_id: job.id,
          attempts: attempt,
          error_code: code,
          error_message: reason,
        });
        captureWorkerException(error, {
          event: 'analysis_job_failed',
          analysis_job_id: job.id,
        });

        return true;
      }
    }

    return true;
  }

  private async executeSingleAttempt(jobId: string): Promise<{ userId: string }> {
    const job = await this.prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: {
        game: {
          select: {
            id: true,
            pgn: true,
          },
        },
      },
    });

    if (!job) {
      throw new Error(`Analysis job ${jobId} not found.`);
    }

    if (!job.game.pgn) {
      throw new Error(`Game ${job.gameId} has no PGN.`);
    }

    const moveSequence = this.parseMoveSequence(job.game.pgn);
    if (moveSequence.length === 0) {
      throw new Error(`Game ${job.gameId} PGN contains no moves.`);
    }

    await this.prisma.analysisMoveEvaluation.deleteMany({
      where: { analysisJobId: jobId },
    });

    const replay = new Chess();
    const startedAt = Date.now();
    const evaluatedPlies: EvaluatedPly[] = [];

    for (let index = 0; index < moveSequence.length; index += 1) {
      const currentMove = moveSequence[index];
      const fenBeforeMove = replay.fen();
      const analysis = await this.stockfish.analyzeFen({
        fen: fenBeforeMove,
        depth: this.config.stockfishDepth,
        timeoutMs: this.config.analysisTimeoutMs,
      });

      await this.prisma.analysisMoveEvaluation.create({
        data: {
          analysisJobId: job.id,
          gameId: job.gameId,
          plyIndex: index + 1,
          fen: fenBeforeMove,
          playedMoveUci: currentMove.uci,
          bestMoveUci: analysis.bestMoveUci,
          scoreCp: analysis.scoreCp,
          scoreMateIn: analysis.scoreMateIn,
          searchedDepth: analysis.searchedDepth,
        },
      });
      evaluatedPlies.push({
        plyIndex: index + 1,
        fen: fenBeforeMove,
        playedMoveUci: currentMove.uci,
        bestMoveUci: analysis.bestMoveUci,
        scoreCp: analysis.scoreCp,
        scoreMateIn: analysis.scoreMateIn,
      });

      replay.move(currentMove.san);

      const completedMoves = index + 1;
      const totalMoves = moveSequence.length;
      const progressPercent = Math.round((completedMoves / totalMoves) * 100);
      const elapsedMs = Date.now() - startedAt;
      const avgPerMoveMs = elapsedMs / completedMoves;
      const remainingMoves = totalMoves - completedMoves;
      const etaSeconds = Math.max(
        0,
        Math.round((avgPerMoveMs * remainingMoves) / 1000),
      );

      await this.prisma.analysisJob.update({
        where: { id: job.id },
        data: {
          progressPercent,
          etaSeconds,
        },
      });
    }

    await this.persistCriticalMistakes({
      jobId: job.id,
      userId: job.userId,
      gameId: job.gameId,
      evaluatedPlies,
    });

    return {
      userId: job.userId,
    };
  }

  private parseMoveSequence(pgn: string) {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });

    return history.map((move) => ({
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ''}`,
    }));
  }

  private isTransientError(error: unknown) {
    if (error instanceof StockfishAnalysisError) {
      return error.transient;
    }

    return false;
  }

  private resolveErrorCode(error: unknown) {
    if (error instanceof StockfishAnalysisError) {
      return error.code;
    }

    return 'analysis_worker_failed';
  }

  private resolveBackoffDelayMs(attempt: number) {
    return Math.min(
      this.config.analysisRetryMaxDelayMs,
      this.config.analysisRetryBaseDelayMs * 2 ** (attempt - 1),
    );
  }

  private async sleep(delayMs: number) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private async persistCriticalMistakes(params: {
    jobId: string;
    userId: string;
    gameId: string;
    evaluatedPlies: EvaluatedPly[];
  }) {
    const mistakes = this.extractCriticalMistakes(params.evaluatedPlies);

    await this.prisma.criticalMistake.deleteMany({
      where: {
        analysisJobId: params.jobId,
      },
    });

    if (mistakes.length === 0) {
      return;
    }

    await this.prisma.criticalMistake.createMany({
      data: mistakes.map((mistake) => ({
        userId: params.userId,
        gameId: params.gameId,
        analysisJobId: params.jobId,
        plyIndex: mistake.plyIndex,
        fen: mistake.fen,
        playedMoveUci: mistake.playedMoveUci,
        bestMoveUci: mistake.bestMoveUci,
        evalDropCp: mistake.evalDropCp,
        phase: mistake.phase,
        severity: mistake.severity,
        category: mistake.category,
      })),
    });
  }

  private extractCriticalMistakes(evaluatedPlies: EvaluatedPly[]): CriticalMistakeRow[] {
    const mistakes: CriticalMistakeRow[] = [];

    for (let index = 0; index < evaluatedPlies.length - 1; index += 1) {
      const current = evaluatedPlies[index];
      const next = evaluatedPlies[index + 1];

      if (!current.bestMoveUci) {
        continue;
      }

      if (current.playedMoveUci === current.bestMoveUci) {
        continue;
      }

      const bestScore = this.normalizeScore(current.scoreCp, current.scoreMateIn);
      const nextScore = this.normalizeScore(next.scoreCp, next.scoreMateIn);

      if (bestScore === null || nextScore === null) {
        continue;
      }

      const playedScore = -nextScore;
      const drop = Math.round(bestScore - playedScore);

      if (drop < 200) {
        continue;
      }

      const severity = drop >= 500 ? 'blunder' : 'mistake';
      const phase = this.resolvePhase(current.plyIndex);
      const category = `${phase}_${severity}`;

      mistakes.push({
        plyIndex: current.plyIndex,
        fen: current.fen,
        playedMoveUci: current.playedMoveUci,
        bestMoveUci: current.bestMoveUci,
        evalDropCp: drop,
        phase,
        severity,
        category,
      });
    }

    return mistakes;
  }

  private normalizeScore(scoreCp: number | null, scoreMateIn: number | null) {
    if (typeof scoreCp === 'number') {
      return scoreCp;
    }

    if (typeof scoreMateIn === 'number' && scoreMateIn !== 0) {
      const direction = scoreMateIn > 0 ? 1 : -1;
      return direction * (100000 - Math.abs(scoreMateIn) * 100);
    }

    return null;
  }

  private resolvePhase(plyIndex: number) {
    if (plyIndex <= 20) {
      return 'opening';
    }

    if (plyIndex <= 60) {
      return 'middlegame';
    }

    return 'endgame';
  }

  private async refreshRecentSummaries(userId: string) {
    const recentCompletedJobs = await this.prisma.analysisJob.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        id: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 25,
    });

    const recentJobIds = recentCompletedJobs.map((job: { id: string }) => job.id);

    await this.prisma.userMistakeSummary.deleteMany({
      where: {
        userId,
      },
    });

    if (recentJobIds.length === 0) {
      return;
    }

    const grouped = await this.prisma.criticalMistake.groupBy({
      by: ['category'],
      where: {
        userId,
        analysisJobId: {
          in: recentJobIds,
        },
      },
      _count: {
        _all: true,
      },
      _avg: {
        evalDropCp: true,
      },
    });

    if (grouped.length === 0) {
      return;
    }

    await this.prisma.userMistakeSummary.createMany({
      data: grouped.map(
        (row: {
          category: string;
          _count: { _all: number };
          _avg: { evalDropCp: number | null };
        }) => ({
          userId,
          category: row.category,
          mistakeCount: row._count._all,
          averageEvalDropCp: Math.round(row._avg.evalDropCp ?? 0),
          recentJobsCount: recentJobIds.length,
        }),
      ),
    });
  }
}
