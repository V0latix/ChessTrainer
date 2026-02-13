import { useId } from 'react';

type ExplanationPanelProps = {
  status: 'correct' | 'incorrect';
  attemptedMoveUci: string;
  bestMoveUci: string;
  attemptedMoveSan?: string | null;
  bestMoveSan?: string | null;
  wrongMoveExplanation: string;
  bestMoveExplanation: string;
};

export function ExplanationPanel({
  status,
  attemptedMoveUci,
  bestMoveUci,
  attemptedMoveSan,
  bestMoveSan,
  wrongMoveExplanation,
  bestMoveExplanation,
}: ExplanationPanelProps) {
  const headingId = useId();
  const attemptedLabel = attemptedMoveSan ?? attemptedMoveUci;
  const bestLabel = bestMoveSan ?? bestMoveUci;
  const takeaway =
    status === 'correct'
      ? 'Tu as trouvé le bon coup. Répète ce motif dans des positions similaires.'
      : `Compare ton idée au coup ${bestLabel} avant de jouer pour éviter ce type d’erreur.`;

  return (
    <section
      className="panel explanation-panel"
      role="region"
      aria-labelledby={headingId}
      aria-live="polite"
    >
      <h2 id={headingId}>Pourquoi ce coup ?</h2>
      <div className="explanation-block">
        <p className="explanation-label">
          Ton coup: <strong>{attemptedLabel}</strong>
        </p>
        <p>{wrongMoveExplanation}</p>
      </div>
      <div className="explanation-block">
        <p className="explanation-label">
          Meilleur coup: <strong>{bestLabel}</strong>
        </p>
        <p>{bestMoveExplanation}</p>
      </div>
      <p className="explanation-takeaway">
        <strong>À retenir:</strong> {takeaway}
      </p>
    </section>
  );
}
