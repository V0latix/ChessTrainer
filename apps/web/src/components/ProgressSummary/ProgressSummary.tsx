type ProgressSummaryProps = {
  totalPuzzles?: number;
  completedPuzzles?: number;
  solvedPuzzles?: number;
  skippedPuzzles?: number;
  currentPositionLabel?: string;
};

export function ProgressSummary({
  totalPuzzles,
  completedPuzzles,
  solvedPuzzles,
  skippedPuzzles,
  currentPositionLabel,
}: ProgressSummaryProps) {
  if (typeof totalPuzzles === 'number' && totalPuzzles > 0) {
    return (
      <section className="panel">
        <h2>Progress Summary</h2>
        <p data-testid="session-position">
          Puzzle courant: {currentPositionLabel ?? `${completedPuzzles ?? 0}/${totalPuzzles}`}
        </p>
        <p data-testid="session-completed">
          Progression: {completedPuzzles ?? 0}/{totalPuzzles}
        </p>
        <p data-testid="session-solved">Résolus: {solvedPuzzles ?? 0}</p>
        <p data-testid="session-skipped">Passés: {skippedPuzzles ?? 0}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Progress Summary</h2>
      <p>Session-level progress recap placeholder for MVP.</p>
    </section>
  );
}
