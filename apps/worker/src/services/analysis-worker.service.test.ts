import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { WorkerConfig } from '../config.js';
import { AnalysisWorkerService } from './analysis-worker.service.js';
import { StockfishAnalysisError } from './stockfish.service.js';

const config: WorkerConfig = {
  pollIntervalMs: 1000,
  batchSize: 5,
  runOnce: true,
  stockfishBinPath: 'stockfish',
  stockfishDepth: 8,
  analysisTimeoutMs: 1000,
  analysisRetryMaxRetries: 2,
  analysisRetryBaseDelayMs: 1,
  analysisRetryMaxDelayMs: 4,
};

function buildPrismaMock(options?: {
  gamePgn?: string | null;
  queuedJobIds?: string[];
}) {
  const updates: Array<Record<string, unknown>> = [];
  const createdMoves: Array<Record<string, unknown>> = [];
  const queuedJobs = options?.queuedJobIds ?? ['job-1'];

  return {
    updates,
    createdMoves,
    prisma: {
      analysisJob: {
        findMany: async () => queuedJobs.map((id) => ({ id })),
        updateMany: async () => ({ count: 1 }),
        update: async (payload: Record<string, unknown>) => {
          updates.push(payload);
          return payload;
        },
        findUnique: async () => ({
          id: 'job-1',
          gameId: 'game-1',
          game: {
            id: 'game-1',
            pgn: options?.gamePgn ?? '1. e4 e5 2. Nf3 Nc6',
          },
        }),
      },
      analysisMoveEvaluation: {
        deleteMany: async () => ({ count: 0 }),
        create: async (payload: Record<string, unknown>) => {
          createdMoves.push(payload);
          return payload;
        },
      },
    },
  };
}

describe('AnalysisWorkerService', () => {
  it('retries transient stockfish failures with exponential policy and completes job', async () => {
    const { prisma, updates, createdMoves } = buildPrismaMock();
    let calls = 0;
    const stockfish = {
      analyzeFen: async () => {
        calls += 1;
        if (calls === 1) {
          throw new StockfishAnalysisError(
            'timeout',
            'stockfish_timeout',
            true,
          );
        }

        return {
          bestMoveUci: 'e2e4',
          scoreCp: 25,
          scoreMateIn: null,
          searchedDepth: 8,
        };
      },
    };

    const service = new AnalysisWorkerService(prisma as any, stockfish as any, config);

    const result = await service.runOnce();

    assert.equal(result.processed, 1);
    assert.ok(calls > 1);
    assert.ok(createdMoves.length > 0);

    const completedUpdate = updates.find((update) => {
      const data = update.data as Record<string, unknown> | undefined;
      return data?.status === 'completed';
    });
    assert.ok(completedUpdate);
  });

  it('marks job as failed on non-transient stockfish errors', async () => {
    const { prisma, updates } = buildPrismaMock();

    const stockfish = {
      analyzeFen: async () => {
        throw new StockfishAnalysisError(
          'missing binary',
          'stockfish_binary_missing',
          false,
        );
      },
    };

    const service = new AnalysisWorkerService(prisma as any, stockfish as any, config);

    const result = await service.runOnce();

    assert.equal(result.processed, 1);

    const failedUpdate = updates.find((update) => {
      const data = update.data as Record<string, unknown> | undefined;
      return data?.status === 'failed';
    });
    assert.ok(failedUpdate);
  });
});
