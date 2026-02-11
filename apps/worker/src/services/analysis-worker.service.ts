import { PrismaClient } from '@prisma/client';
import { Chess } from 'chess.js';
import type { WorkerConfig } from '../config.js';
import { StockfishAnalysisError, StockfishService } from './stockfish.service.js';

type QueuedJob = {
  id: string;
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
      return false;
    }

    const maxAttempts = this.config.analysisRetryMaxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.prisma.analysisJob.update({
          where: { id: job.id },
          data: { attemptCount: attempt },
        });

        await this.executeSingleAttempt(job.id);

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

        return true;
      } catch (error) {
        const isTransient = this.isTransientError(error);

        if (isTransient && attempt < maxAttempts) {
          await this.sleep(this.resolveBackoffDelayMs(attempt));
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

        return true;
      }
    }

    return true;
  }

  private async executeSingleAttempt(jobId: string) {
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
}
