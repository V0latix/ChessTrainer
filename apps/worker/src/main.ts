import { PrismaClient } from '@prisma/client';
import { loadWorkerConfig } from './config.js';
import { AnalysisWorkerService } from './services/analysis-worker.service.js';
import { StockfishService } from './services/stockfish.service.js';

async function bootstrap() {
  const config = loadWorkerConfig();
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

  const now = new Date().toISOString();
  console.log(`[worker] ChessTrainer worker bootstrap - ${now}`);
  console.log(
    `[worker] mode=${config.runOnce ? 'once' : 'poll'} interval=${config.pollIntervalMs}ms batch=${config.batchSize} depth=${config.stockfishDepth}`,
  );

  try {
    if (config.runOnce) {
      const result = await worker.runOnce();
      console.log(`[worker] processed=${result.processed}`);
      await prisma.$disconnect();
      return;
    }

    while (true) {
      const result = await worker.runOnce();
      if (result.processed > 0) {
        console.log(`[worker] processed=${result.processed}`);
      }
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
    }
  } catch (error) {
    console.error(
      '[worker] fatal error:',
      error instanceof Error ? error.message : error,
    );
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
