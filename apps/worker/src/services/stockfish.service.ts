import { spawn } from 'node:child_process';

export type StockfishEvaluation = {
  bestMoveUci: string | null;
  scoreCp: number | null;
  scoreMateIn: number | null;
  searchedDepth: number | null;
};

export class StockfishAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'stockfish_timeout'
      | 'stockfish_spawn_failed'
      | 'stockfish_binary_missing'
      | 'stockfish_no_bestmove'
      | 'stockfish_process_closed',
    public readonly transient: boolean,
  ) {
    super(message);
    this.name = 'StockfishAnalysisError';
  }
}

export class StockfishService {
  constructor(private readonly stockfishBinPath: string) {}

  async analyzeFen(params: {
    fen: string;
    depth: number;
    timeoutMs: number;
  }): Promise<StockfishEvaluation> {
    return new Promise<StockfishEvaluation>((resolve, reject) => {
      const processRef = spawn(this.stockfishBinPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let settled = false;
      let outputBuffer = '';
      let lastScoreCp: number | null = null;
      let lastScoreMateIn: number | null = null;
      let lastDepth: number | null = null;
      let bestMoveUci: string | null = null;

      const settle = (
        next:
          | { kind: 'resolve'; value: StockfishEvaluation }
          | { kind: 'reject'; error: Error },
      ) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutHandle);
        processRef.stdin.write('quit\n');
        processRef.stdin.end();

        if (next.kind === 'resolve') {
          resolve(next.value);
          return;
        }

        reject(next.error);
      };

      const timeoutHandle = setTimeout(() => {
        processRef.kill('SIGKILL');
        settle({
          kind: 'reject',
          error: new StockfishAnalysisError(
            `Stockfish timed out after ${params.timeoutMs} ms.`,
            'stockfish_timeout',
            true,
          ),
        });
      }, params.timeoutMs);

      const onOutputLine = (line: string) => {
        if (line.startsWith('info ')) {
          const depthMatch = line.match(/\bdepth\s+(\d+)/);
          if (depthMatch) {
            lastDepth = Number(depthMatch[1]);
          }

          const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
          if (cpMatch) {
            lastScoreCp = Number(cpMatch[1]);
            lastScoreMateIn = null;
          }

          const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
          if (mateMatch) {
            lastScoreMateIn = Number(mateMatch[1]);
            lastScoreCp = null;
          }
          return;
        }

        if (line.startsWith('bestmove ')) {
          const token = line.split(/\s+/)[1] ?? null;
          bestMoveUci = token === '(none)' ? null : token;
          settle({
            kind: 'resolve',
            value: {
              bestMoveUci,
              scoreCp: lastScoreCp,
              scoreMateIn: lastScoreMateIn,
              searchedDepth: lastDepth,
            },
          });
        }
      };

      processRef.stdout.on('data', (chunk: Buffer) => {
        outputBuffer += chunk.toString('utf8');
        const lines = outputBuffer.split('\n');
        outputBuffer = lines.pop() ?? '';
        for (const line of lines) {
          onOutputLine(line.trim());
        }
      });

      processRef.on('error', (error) => {
        const errno = error as NodeJS.ErrnoException;
        if (errno.code === 'ENOENT') {
          settle({
            kind: 'reject',
            error: new StockfishAnalysisError(
              `Stockfish binary not found at "${this.stockfishBinPath}".`,
              'stockfish_binary_missing',
              false,
            ),
          });
          return;
        }

        settle({
          kind: 'reject',
          error: new StockfishAnalysisError(
            `Stockfish spawn failed: ${error.message}`,
            'stockfish_spawn_failed',
            true,
          ),
        });
      });

      processRef.on('close', (code, signal) => {
        if (settled) {
          return;
        }

        if (!bestMoveUci) {
          settle({
            kind: 'reject',
            error: new StockfishAnalysisError(
              `Stockfish finished without bestmove (code=${String(code)}, signal=${String(signal)}).`,
              'stockfish_no_bestmove',
              true,
            ),
          });
          return;
        }

        settle({
          kind: 'reject',
          error: new StockfishAnalysisError(
            `Stockfish process closed unexpectedly (code=${String(code)}, signal=${String(signal)}).`,
            'stockfish_process_closed',
            true,
          ),
        });
      });

      processRef.stdin.write('uci\n');
      processRef.stdin.write('isready\n');
      processRef.stdin.write('ucinewgame\n');
      processRef.stdin.write(`position fen ${params.fen}\n`);
      processRef.stdin.write(`go depth ${params.depth}\n`);
    });
  }
}
