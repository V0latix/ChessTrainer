type PuzzleProps = {
  objective?: string;
  source?: string;
  context?: {
    phase: string;
    severity: string;
    category: string;
    played_move_uci: string;
    best_move_uci: string;
    eval_drop_cp: number;
    game_url: string;
  };
};

export function Puzzle({ objective, source, context }: PuzzleProps) {
  return (
    <section className="panel">
      <h2>Puzzle</h2>
      {objective ? (
        <>
          <p className="puzzle-objective">{objective}</p>
          {source ? <p className="puzzle-meta">Source: {source}</p> : null}
          {context ? (
            <ul className="puzzle-context-list">
              <li>Phase: {context.phase}</li>
              <li>Sévérité: {context.severity}</li>
              <li>Catégorie: {context.category}</li>
              <li>Ton coup: {context.played_move_uci}</li>
              <li>Meilleur coup: {context.best_move_uci}</li>
              <li>Perte estimée: {context.eval_drop_cp} cp</li>
              <li>
                Partie source:{' '}
                <a href={context.game_url} target="_blank" rel="noreferrer">
                  ouvrir sur Chess.com
                </a>
              </li>
            </ul>
          ) : null}
        </>
      ) : (
        <p>Mistake-to-puzzle flow entry point (MVP custom component placeholder).</p>
      )}
    </section>
  );
}
