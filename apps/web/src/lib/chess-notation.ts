import { Chess } from 'chess.js';

function parseUciMove(uci: string): { from: string; to: string; promotion?: string } | null {
  const normalized = uci.trim();
  if (normalized.length < 4) {
    return null;
  }

  const from = normalized.slice(0, 2);
  const to = normalized.slice(2, 4);
  const promotion = normalized.length >= 5 ? normalized.slice(4, 5) : undefined;

  return { from, to, promotion };
}

export function uciToSan(params: { fen: string; uci: string }): string | null {
  const parsed = parseUciMove(params.uci);
  if (!parsed) {
    return null;
  }

  try {
    const game = new Chess(params.fen);
    const move = game.move({
      from: parsed.from,
      to: parsed.to,
      promotion: parsed.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
    });

    return move?.san ?? null;
  } catch {
    // Data can be inconsistent (e.g. move doesn't match the provided FEN).
    // Fallback to UCI display at callsites when SAN can't be computed.
    return null;
  }
}

const UCI_MOVE_RE = /\b[a-h][1-8][a-h][1-8][qrbn]?\b/g;

export function replaceUciWithSan(params: { fen: string; text: string }): string {
  const cache = new Map<string, string>();

  return params.text.replace(UCI_MOVE_RE, (match) => {
    const cached = cache.get(match);
    if (cached) {
      return cached;
    }

    const san = uciToSan({ fen: params.fen, uci: match });
    const replacement = san ?? match;
    cache.set(match, replacement);
    return replacement;
  });
}
