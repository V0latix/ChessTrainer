export type WorkerConfig = {
  pollIntervalMs: number;
  batchSize: number;
  runOnce: boolean;
  stockfishBinPath: string;
  stockfishDepth: number;
  analysisTimeoutMs: number;
  analysisRetryMaxRetries: number;
  analysisRetryBaseDelayMs: number;
  analysisRetryMaxDelayMs: number;
};

function readPositiveInt(envKey: string, fallback: number) {
  const value = Number(process.env[envKey]);

  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.floor(value);
}

function readBoolean(envKey: string, fallback: boolean) {
  const raw = process.env[envKey];
  if (!raw) {
    return fallback;
  }

  return raw === '1' || raw.toLowerCase() === 'true';
}

export function loadWorkerConfig(): WorkerConfig {
  return {
    pollIntervalMs: readPositiveInt('WORKER_POLL_INTERVAL_MS', 5000),
    batchSize: Math.max(1, readPositiveInt('WORKER_BATCH_SIZE', 1)),
    runOnce: readBoolean('WORKER_RUN_ONCE', false),
    stockfishBinPath: process.env.STOCKFISH_BIN_PATH?.trim() || 'stockfish',
    stockfishDepth: Math.max(6, readPositiveInt('ANALYSIS_STOCKFISH_DEPTH', 12)),
    analysisTimeoutMs: Math.max(1000, readPositiveInt('ANALYSIS_TIMEOUT_MS', 60000)),
    analysisRetryMaxRetries: readPositiveInt('ANALYSIS_RETRY_MAX_RETRIES', 2),
    analysisRetryBaseDelayMs: readPositiveInt('ANALYSIS_RETRY_BASE_DELAY_MS', 500),
    analysisRetryMaxDelayMs: Math.max(
      500,
      readPositiveInt('ANALYSIS_RETRY_MAX_DELAY_MS', 5000),
    ),
  };
}
