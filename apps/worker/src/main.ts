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
  const prisma = new PrismaClient();
  const stockfish = new StockfishService(config.stockfishBinPath);
  const worker = new AnalysisWorkerService(prisma, stockfish, config);

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
      const result = await worker.runOnce();
      if (result.processed > 0) {
        logInfo({
          event: 'worker_batch_processed',
          processed: result.processed,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
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
