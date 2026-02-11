type ExplanationPanelProps = {
  status: 'correct' | 'incorrect';
  attemptedMoveUci: string;
  bestMoveUci: string;
  wrongMoveExplanation: string;
  bestMoveExplanation: string;
};

export function ExplanationPanel({
  status,
  attemptedMoveUci,
  bestMoveUci,
  wrongMoveExplanation,
  bestMoveExplanation,
}: ExplanationPanelProps) {
  const takeaway =
    status === 'correct'
      ? 'Tu as trouvé le bon coup. Répète ce motif dans des positions similaires.'
      : `Compare ton idée au coup ${bestMoveUci} avant de jouer pour éviter ce type d’erreur.`;

  return (
    <section className="panel explanation-panel" aria-live="polite">
      <h2>Pourquoi ce coup ?</h2>
      <div className="explanation-block">
        <p className="explanation-label">
          Ton coup: <strong>{attemptedMoveUci}</strong>
        </p>
        <p>{wrongMoveExplanation}</p>
      </div>
      <div className="explanation-block">
        <p className="explanation-label">
          Meilleur coup: <strong>{bestMoveUci}</strong>
        </p>
        <p>{bestMoveExplanation}</p>
      </div>
      <p className="explanation-takeaway">
        <strong>À retenir:</strong> {takeaway}
      </p>
    </section>
  );
}
