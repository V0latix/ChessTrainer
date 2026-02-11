import { useId, useMemo, useState } from 'react';
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
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
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

  const sideToMove = game.turn() === 'w' ? 'blancs' : 'noirs';

  function handleSquareClick(square: string) {
    if (isDisabled) {
      return;
    }

    if (!selectedSquare) {
      setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const nextGame = new Chess(game.fen());
    const move = nextGame.move({
      from: selectedSquare,
      to: square,
      promotion: 'q',
    });

    if (!move) {
      setSelectedSquare(square);
      return;
    }

    setGame(nextGame);
    setSelectedSquare(null);
    onMovePlayed?.(`${move.from}${move.to}${move.promotion ?? ''}`);
  }

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

          return (
            <button
              key={item.square}
              type="button"
              className={[
                'board-square',
                item.isLightSquare ? 'board-square-light' : 'board-square-dark',
                isSelected ? 'board-square-selected' : '',
                isDisabled ? 'board-square-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSquareClick(item.square)}
              disabled={isDisabled}
              aria-label={`Case ${item.square}${
                pieceLabel ? `, pièce ${pieceLabel}` : ''
              }`}
              aria-pressed={isSelected}
            >
              {symbol}
            </button>
          );
        })}
      </div>
    </section>
  );
}
