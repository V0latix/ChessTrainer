import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';

type BoardProps = {
  initialFen?: string;
  title?: string;
  onMovePlayed?: (uciMove: string) => void;
  isDisabled?: boolean;
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

const PIECE_SYMBOLS: Record<string, string> = {
  // Use the "black" chess glyphs for both sides (they're solid in most fonts),
  // then color via CSS based on piece color.
  wp: '♟',
  wn: '♞',
  wb: '♝',
  wr: '♜',
  wq: '♛',
  wk: '♚',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
};

const PIECE_LABELS: Record<string, string> = {
  wp: 'pion blanc',
  wn: 'cavalier blanc',
  wb: 'fou blanc',
  wr: 'tour blanche',
  wq: 'dame blanche',
  wk: 'roi blanc',
  bp: 'pion noir',
  bn: 'cavalier noir',
  bb: 'fou noir',
  br: 'tour noire',
  bq: 'dame noire',
  bk: 'roi noir',
};

export function Board({
  initialFen,
  title,
  onMovePlayed,
  isDisabled = false,
}: BoardProps) {
  const helpId = useId();
  const [game, setGame] = useState(() => new Chess(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverSquare, setDragOverSquare] = useState<string | null>(null);
  const suppressNextClickRef = useRef(false);
  const pointerDownSquareRef = useRef<string | null>(null);

  const boardSquares = useMemo(
    () =>
      RANKS.flatMap((rank) =>
        FILES.map((file) => {
          const square = `${file}${rank}` as Square;
          const piece = game.get(square);
          const isLightSquare =
            (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;

          return {
            square,
            isLightSquare,
            piece,
          };
        }),
      ),
    [game],
  );

  const turnColor = game.turn();
  const sideToMove = turnColor === 'w' ? 'blancs' : 'noirs';

  const legalMoveTargets = useMemo(() => {
    if (!selectedSquare) {
      return new Map<string, { isCapture: boolean }>();
    }

    const piece = game.get(selectedSquare as Square);
    if (!piece || piece.color !== turnColor) {
      return new Map<string, { isCapture: boolean }>();
    }

    const moves = game.moves({ square: selectedSquare as Square, verbose: true }) as Array<{
      to: string;
      flags: string;
    }>;

    const targets = new Map<string, { isCapture: boolean }>();
    for (const move of moves) {
      targets.set(move.to, { isCapture: move.flags.includes('c') });
    }
    return targets;
  }, [game, selectedSquare, turnColor]);

  function tryMakeMove(from: string, to: string) {
    if (isDisabled) {
      return;
    }

    if (from === to) {
      setSelectedSquare(null);
      return;
    }

    const nextGame = new Chess(game.fen());
    const move = nextGame.move({
      from,
      to,
      promotion: 'q',
    });

    if (!move) {
      setSelectedSquare(to);
      return;
    }

    setGame(nextGame);
    setSelectedSquare(null);
    onMovePlayed?.(`${move.from}${move.to}${move.promotion ?? ''}`);
  }

  function handleSquareClick(square: string) {
    if (isDisabled) {
      return;
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (!selectedSquare) {
      const piece = game.get(square as Square);
      if (!piece || piece.color !== turnColor) {
        return;
      }

      setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    tryMakeMove(selectedSquare, square);
  }

  useEffect(() => {
    const handlePointerUp = () => {
      pointerDownSquareRef.current = null;
      setIsDragging(false);
      setDragOverSquare(null);
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  return (
    <section className="panel board-panel">
      <h2>{title ?? 'Board'}</h2>
      <p className="board-meta">Trait: {sideToMove}</p>
      <p id={helpId} className="board-help">
        Clavier: sélectionne la case de départ puis la case d’arrivée avec
        <strong> Entrée</strong> ou <strong>Espace</strong>.
      </p>
      <div
        className="board-grid"
        role="grid"
        aria-label="Échiquier interactif"
        aria-describedby={helpId}
      >
        {boardSquares.map((item) => {
          const pieceKey = item.piece ? `${item.piece.color}${item.piece.type}` : null;
          const symbol = pieceKey ? PIECE_SYMBOLS[pieceKey] : '';
          const pieceLabel = pieceKey ? PIECE_LABELS[pieceKey] : null;
          const isSelected = selectedSquare === item.square;
          const pieceColor = item.piece?.color ?? null;
          const moveTargetMeta = legalMoveTargets.get(item.square) ?? null;

          return (
            <button
              key={item.square}
              type="button"
              className={[
                'board-square',
                item.isLightSquare ? 'board-square-light' : 'board-square-dark',
                isSelected ? 'board-square-selected' : '',
                isDragging && dragOverSquare === item.square ? 'board-square-drag-over' : '',
                isDisabled ? 'board-square-disabled' : '',
                pieceColor ? `board-square-has-piece board-square-has-piece-${pieceColor}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSquareClick(item.square)}
              onPointerDown={(event) => {
                if (event.button !== 0) {
                  return;
                }
                event.preventDefault();
                if (isDisabled) {
                  return;
                }

                const piece = game.get(item.square as Square);
                if (!piece || piece.color !== turnColor) {
                  pointerDownSquareRef.current = null;
                  return;
                }

                pointerDownSquareRef.current = item.square;
              }}
              onPointerEnter={(event) => {
                if (isDisabled) {
                  return;
                }

                const origin = pointerDownSquareRef.current;
                if (!origin) {
                  return;
                }

                // Only treat it as a drag when the pointer is held down and we entered another square.
                if ((event.buttons & 1) !== 1) {
                  return;
                }

                if (origin === item.square) {
                  return;
                }

                if (!isDragging) {
                  setSelectedSquare(origin);
                  setIsDragging(true);
                }

                setDragOverSquare(item.square);
              }}
              onPointerUp={(event) => {
                if (event.button !== 0) {
                  return;
                }

                const origin = pointerDownSquareRef.current;
                pointerDownSquareRef.current = null;

                if (!origin) {
                  return;
                }

                if (!isDragging) {
                  // Let the click handler do the regular selection/move logic.
                  setDragOverSquare(null);
                  return;
                }

                event.preventDefault();
                suppressNextClickRef.current = true;
                setIsDragging(false);
                setDragOverSquare(null);

                if (origin === item.square) {
                  return;
                }

                tryMakeMove(origin, item.square);
              }}
              disabled={isDisabled}
              aria-label={`Case ${item.square}${
                pieceLabel ? `, pièce ${pieceLabel}` : ''
              }`}
              aria-pressed={isSelected}
            >
              {moveTargetMeta ? (
                <span
                  className={[
                    'board-move-dot',
                    moveTargetMeta.isCapture ? 'board-move-dot-capture' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                />
              ) : null}
              {symbol ? (
                <span
                  className={[
                    'board-piece',
                    pieceColor ? `board-piece-${pieceColor}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                >
                  {symbol}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
