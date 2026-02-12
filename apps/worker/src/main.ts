import { PrismaClient } from '@prisma/client';
import { loadWorkerConfig } from './config.js';
import { logError, logInfo } from './observability/logger.js';
import {
  captureWorkerException,
  initWorkerSentry,
} from './observability/sentry.js';
import { AnalysisWorkerService } from './services/analysis-worker.service.js';
import { StockfishService } from './services/stockfish.service.js';

async function bootstrap() {
  const config = loadWorkerConfig();
  const sentryEnabled = initWorkerSentry();
  // Ensure we always log fatal bootstrap errors (Prisma client not generated, bad DB URL, etc.)
  process.on('unhandledRejection', (reason) => {
    logError({
      event: 'worker_unhandled_rejection',
      error_message: reason instanceof Error ? reason.message : String(reason),
    });
    captureWorkerException(reason, { event: 'worker_unhandled_rejection' });
  });

  process.on('uncaughtException', (error) => {
    logError({
      event: 'worker_uncaught_exception',
      error_name: error.name,
      error_message: error.message,
    });
    captureWorkerException(error, { event: 'worker_uncaught_exception' });
    process.exit(1);
  });

  let prisma: PrismaClient;
  let worker: AnalysisWorkerService;

  try {
    prisma = new PrismaClient();
    await prisma.$connect();

    const stockfish = new StockfishService(config.stockfishBinPath);
    worker = new AnalysisWorkerService(prisma, stockfish, config);
  } catch (error) {
    logError({
      event: 'worker_bootstrap_failed',
      error_name: error instanceof Error ? error.name : 'UnknownError',
      error_message: error instanceof Error ? error.message : String(error),
      hint:
        'If this is "@prisma/client did not initialize yet", ensure your deploy runs `prisma generate` using apps/api/prisma/schema.prisma before starting the worker.',
    });
    captureWorkerException(error, { event: 'worker_bootstrap_failed' });
    process.exit(1);
    return;
  }

  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });

  logInfo({
    event: 'worker_bootstrap',
    mode: config.runOnce ? 'once' : 'poll',
    poll_interval_ms: config.pollIntervalMs,
    batch_size: config.batchSize,
    stockfish_depth: config.stockfishDepth,
    sentry_enabled: sentryEnabled,
  });

  try {
    if (config.runOnce) {
      const result = await worker.runOnce();
      logInfo({
        event: 'worker_run_once_completed',
        processed: result.processed,
      });
      await prisma.$disconnect();
      return;
    }

    while (true) {
      try {
        const result = await worker.runOnce();
        if (result.processed > 0) {
          logInfo({
            event: 'worker_batch_processed',
            processed: result.processed,
          });
        }
      } catch (error) {
        // Keep the worker alive on transient failures (DB connectivity hiccup, etc.).
        logError({
          event: 'worker_run_once_failed',
          error_name: error instanceof Error ? error.name : 'UnknownError',
          error_message: error instanceof Error ? error.message : String(error),
        });
        captureWorkerException(error, {
          event: 'worker_run_once_failed',
        });
      } finally {
        await new Promise((resolve) =>
          setTimeout(resolve, config.pollIntervalMs),
        );
      }
    }
  } catch (error) {
    logError({
      event: 'worker_fatal_error',
      error_name: error instanceof Error ? error.name : 'UnknownError',
      error_message: error instanceof Error ? error.message : String(error),
    });
    captureWorkerException(error, {
      event: 'worker_fatal_error',
    });
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
