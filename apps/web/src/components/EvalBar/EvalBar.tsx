type EvalBarProps = {
  // Positive means advantage white, negative means advantage black.
  evalPawns: number;
};

const MAX_EVAL = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function EvalBar({ evalPawns }: EvalBarProps) {
  const clamped = clamp(evalPawns, -MAX_EVAL, MAX_EVAL);
  const percent = (MAX_EVAL - clamped) / (2 * MAX_EVAL); // 0 => top(white), 1 => bottom(black)
  const markerTop = `${Math.round(percent * 1000) / 10}%`;

  return (
    <div className="eval-bar" role="img" aria-label={`Évaluation: ${clamped}`}>
      <div className="eval-bar-track" />
      <div className="eval-bar-marker" style={{ top: markerTop }} />
    </div>
  );
}

