import { useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';

type BoardProps = {
  initialFen?: string;
  title?: string;
  onMovePlayed?: (uciMove: string) => void;
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

export function Board({ initialFen, title, onMovePlayed }: BoardProps) {
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
      <div className="board-grid" role="grid" aria-label="Échiquier interactif">
        {boardSquares.map((item) => {
          const pieceKey = item.piece ? `${item.piece.color}${item.piece.type}` : null;
          const symbol = pieceKey ? PIECE_SYMBOLS[pieceKey] : '';
          const isSelected = selectedSquare === item.square;

          return (
            <button
              key={item.square}
              type="button"
              className={[
                'board-square',
                item.isLightSquare ? 'board-square-light' : 'board-square-dark',
                isSelected ? 'board-square-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSquareClick(item.square)}
              aria-label={`Case ${item.square}${symbol ? `, pièce ${symbol}` : ''}`}
            >
              {symbol}
            </button>
          );
        })}
      </div>
    </section>
  );
}
