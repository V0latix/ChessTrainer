import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { EvalBar } from '../../components/EvalBar/EvalBar';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { recordPuzzleSession } from '../../lib/progress';
import { replaceUciWithSan, uciToSan } from '../../lib/chess-notation';
import {
  evaluatePuzzleAttempt,
  getPuzzleSession,
  type EvaluatePuzzleAttemptResponse,
  type NextPuzzleResponse,
} from '../../lib/puzzles';
import { useAuth } from '../auth/auth-context';

type PuzzleTrainerProps = {
  limit?: number;
  showPuzzlePanel?: boolean;
  showContextPanel?: boolean;
  showEvalBar?: boolean;
};

export function PuzzleTrainer({
  limit = 10,
  showPuzzlePanel = true,
  showContextPanel = true,
  showEvalBar = true,
}: PuzzleTrainerProps) {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionPuzzles, setSessionPuzzles] = useState<NextPuzzleResponse[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [lastMoveUci, setLastMoveUci] = useState<string | null>(null);
  const [lastMoveSan, setLastMoveSan] = useState<string | null>(null);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [attemptResult, setAttemptResult] =
    useState<EvaluatePuzzleAttemptResponse | null>(null);
  const [boardResetVersion, setBoardResetVersion] = useState(0);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>([]);
  const [skippedPuzzleIds, setSkippedPuzzleIds] = useState<string[]>([]);
  const [isPersistingSession, setIsPersistingSession] = useState(false);
  const [isSessionPersisted, setIsSessionPersisted] = useState(false);
  const positionGameRef = useRef<Chess | null>(null);
  const [liveEvalPawns, setLiveEvalPawns] = useState(0);

  const currentPuzzle = sessionPuzzles[currentPuzzleIndex] ?? null;
  const currentPuzzleId = currentPuzzle?.puzzle_id ?? null;
  const currentPuzzleFen = currentPuzzle?.fen ?? null;
  const isSessionComplete =
    sessionPuzzles.length > 0 && currentPuzzleIndex >= sessionPuzzles.length;
  const totalPuzzles = sessionPuzzles.length;
  const completedPuzzles = Math.min(currentPuzzleIndex, totalPuzzles);
  const currentPositionLabel = isSessionComplete
    ? `${totalPuzzles}/${totalPuzzles}`
    : `${Math.min(currentPuzzleIndex + 1, totalPuzzles)}/${totalPuzzles}`;

  const showInfoPanel = showPuzzlePanel || showContextPanel;
  const attemptNotation = useMemo(() => {
    if (!attemptResult || !currentPuzzle) {
      return null;
    }

    const fen = currentPuzzle.fen;
    const attemptedSan = uciToSan({ fen, uci: attemptResult.attempted_move_uci });
    const bestSan = uciToSan({ fen, uci: attemptResult.best_move_uci });

    return {
      attemptedSan,
      bestSan,
      wrongMoveExplanation: replaceUciWithSan({
        fen,
        text: attemptResult.wrong_move_explanation,
      }),
      bestMoveExplanation: replaceUciWithSan({
        fen,
        text: attemptResult.best_move_explanation,
      }),
      feedbackMessage: replaceUciWithSan({ fen, text: attemptResult.feedback_message }),
    };
  }, [attemptResult, currentPuzzle]);

  function formatDateForInfo(value: string | null | undefined) {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('fr-FR', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        const result = await getPuzzleSession({
          accessToken: session.access_token,
          limit,
        });

        if (isCancelled) {
          return;
        }

        setSessionPuzzles(result.puzzles);
        setCurrentPuzzleIndex(0);
        setLastMoveUci(null);
        setAttemptResult(null);
        setBoardResetVersion(0);
        setSolvedPuzzleIds([]);
        setSkippedPuzzleIds([]);
        setIsPersistingSession(false);
        setIsSessionPersisted(false);
        setErrorMessage(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setSessionPuzzles([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger la session de puzzle.',
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [limit, session?.access_token]);

  async function handleMovePlayed(uciMove: string) {
    if (!session?.access_token || !currentPuzzle || isSubmittingAttempt) {
      return;
    }

    setLastMoveUci(uciMove);
    setErrorMessage(null);

    // Keep a local mirror of the played move so the eval bar can update immediately.
    try {
      const from = uciMove.slice(0, 2);
      const to = uciMove.slice(2, 4);
      const promotion = uciMove.length > 4 ? uciMove.slice(4, 5) : 'q';

      if (from.length === 2 && to.length === 2) {
        const next = new Chess(
          positionGameRef.current?.fen() ?? currentPuzzle.fen,
        );
        const move = next.move({ from, to, promotion });
        if (move) {
          positionGameRef.current = next;
          setLiveEvalPawns(estimateEvalPawns(next));
        }
      }
    } catch {
      // Ignore: eval is best-effort, server remains source of truth for puzzle validation.
    }

    // After the first server-validated attempt, allow free play locally
    // (eval bar keeps moving) but don't submit additional attempts.
    if (attemptResult) {
      return;
    }

    setIsSubmittingAttempt(true);
    try {
      const result = await evaluatePuzzleAttempt({
        accessToken: session.access_token,
        puzzleId: currentPuzzle.puzzle_id,
        attemptedMoveUci: uciMove,
      });
      setAttemptResult(result);

      if (result.is_correct) {
        setSolvedPuzzleIds((previous) =>
          previous.includes(result.puzzle_id)
            ? previous
            : [...previous, result.puzzle_id],
        );
      }
    } catch (error) {
      setAttemptResult(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’évaluer ce coup pour le moment.',
      );
    } finally {
      setIsSubmittingAttempt(false);
    }
  }

  function advanceToNextPuzzle() {
    setAttemptResult(null);
    setLastMoveUci(null);
    setLastMoveSan(null);
    setErrorMessage(null);
    setBoardResetVersion(0);
    setCurrentPuzzleIndex((previous) => previous + 1);
  }

  function handleRetry() {
    setAttemptResult(null);
    setLastMoveUci(null);
    setLastMoveSan(null);
    setErrorMessage(null);
    setBoardResetVersion((previous) => previous + 1);
  }

  function handleSkipPuzzle() {
    if (!currentPuzzle) {
      return;
    }

    setSkippedPuzzleIds((previous) =>
      previous.includes(currentPuzzle.puzzle_id)
        ? previous
        : [...previous, currentPuzzle.puzzle_id],
    );
    advanceToNextPuzzle();
  }

  const canContinueAfterSolve = useMemo(
    () => Boolean(attemptResult?.is_correct),
    [attemptResult],
  );

  function evalAfterUciMove(params: { fen: string; uci: string }): number | null {
    const normalized = params.uci.trim();
    if (normalized.length < 4) {
      return null;
    }

    const from = normalized.slice(0, 2);
    const to = normalized.slice(2, 4);
    const promotion = normalized.length >= 5 ? normalized.slice(4, 5) : undefined;

    try {
      const game = new Chess(params.fen);
      const move = game.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });
      if (!move) {
        return null;
      }
      return estimateEvalPawns(game);
    } catch {
      return null;
    }
  }

  const evalGain = useMemo(() => {
    if (!currentPuzzle || !lastMoveUci) {
      return null;
    }

    const fen = currentPuzzle.fen;
    const evalAfterGame = evalAfterUciMove({
      fen,
      uci: currentPuzzle.context.played_move_uci,
    });
    const evalAfterUser = evalAfterUciMove({ fen, uci: lastMoveUci });
    if (evalAfterGame == null || evalAfterUser == null) {
      return null;
    }

    const sideSign = currentPuzzle.side_to_move === 'white' ? 1 : -1;
    return sideSign * (evalAfterUser - evalAfterGame);
  }, [currentPuzzle, lastMoveUci]);

  function formatSigned(value: number, decimals = 1) {
    const factor = 10 ** decimals;
    const rounded = Math.round(value * factor) / factor;
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded.toFixed(decimals)}`;
  }

  function estimateEvalPawns(game: Chess) {
    // Super simple eval: material + small positional nudges (centipawns).
    const baseValues: Record<string, number> = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 0,
    };

    const knightPst = [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 20, 25, 25, 20, 5, -30],
      [-30, 0, 20, 25, 25, 20, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50],
    ];

    const bishopPst = [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 10, 10, 10, 10, 0, -10],
      [-10, 5, 10, 15, 15, 10, 5, -10],
      [-10, 0, 10, 15, 15, 10, 0, -10],
      [-10, 5, 10, 10, 10, 10, 5, -10],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20],
    ];

    const pawnPst = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [5, 10, 10, -15, -15, 10, 10, 5],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [0, 0, 0, 20, 20, 0, 0, 0],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const rookPst = [
      [0, 0, 5, 10, 10, 5, 0, 0],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [5, 10, 10, 10, 10, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const queenPst = [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 5, 5, 5, 5, 0, -10],
      [-5, 0, 5, 5, 5, 5, 0, -5],
      [0, 0, 5, 5, 5, 5, 0, -5],
      [-10, 5, 5, 5, 5, 5, 0, -10],
      [-10, 0, 5, 0, 0, 0, 0, -10],
      [-20, -10, -10, -5, -5, -10, -10, -20],
    ];

    const pstByType: Record<string, number[][]> = {
      p: pawnPst,
      n: knightPst,
      b: bishopPst,
      r: rookPst,
      q: queenPst,
    };

    if (game.isCheckmate()) {
      // Side to move is checkmated.
      return game.turn() === 'w' ? -100 : 100;
    }

    let scoreCp = 0;
    const board = game.board(); // rank 8 -> 1

    for (let rank = 0; rank < board.length; rank += 1) {
      for (let file = 0; file < board[rank].length; file += 1) {
        const piece = board[rank][file];
        if (!piece) {
          continue;
        }

        const sign = piece.color === 'w' ? 1 : -1;
        scoreCp += sign * (baseValues[piece.type] ?? 0);

        const pst = pstByType[piece.type];
        if (pst) {
          const pstRank = piece.color === 'w' ? rank : 7 - rank;
          scoreCp += sign * pst[pstRank][file];
        }
      }
    }

    // Small check bonus/penalty (side to move is in check).
    if (game.inCheck()) {
      scoreCp += game.turn() === 'w' ? -40 : 40;
    }

    return Math.max(-12, Math.min(12, scoreCp / 100));
  }

  useEffect(() => {
    if (!currentPuzzleFen) {
      positionGameRef.current = null;
      setLiveEvalPawns(0);
      return;
    }

    const game = new Chess(currentPuzzleFen);
    positionGameRef.current = game;
    setLiveEvalPawns(estimateEvalPawns(game));
  }, [boardResetVersion, currentPuzzleFen, currentPuzzleId]);

  useEffect(() => {
    if (!session?.access_token || !isSessionComplete || totalPuzzles === 0) {
      return;
    }

    if (isPersistingSession || isSessionPersisted) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsPersistingSession(true);

      try {
        await recordPuzzleSession({
          accessToken: session.access_token,
          totalPuzzles,
          solvedPuzzles: solvedPuzzleIds.length,
          skippedPuzzles: skippedPuzzleIds.length,
        });

        if (!cancelled) {
          setIsSessionPersisted(true);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Impossible d’enregistrer ce résumé de session.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsPersistingSession(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session?.access_token,
    isSessionComplete,
    totalPuzzles,
    solvedPuzzleIds.length,
    skippedPuzzleIds.length,
    isPersistingSession,
    isSessionPersisted,
  ]);

  if (!session?.access_token) {
    return (
      <p className="auth-message auth-message-error">
        Session invalide, reconnecte-toi puis réessaie.
      </p>
    );
  }

  return (
    <>
      {isLoading ? (
        <p className="auth-message" role="status" aria-live="polite">
          Chargement de la session...
        </p>
      ) : null}
      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && totalPuzzles > 0 ? (
        <ProgressSummary
          totalPuzzles={totalPuzzles}
          completedPuzzles={completedPuzzles}
          solvedPuzzles={solvedPuzzleIds.length}
          skippedPuzzles={skippedPuzzleIds.length}
          currentPositionLabel={currentPositionLabel}
        />
      ) : null}

      {!isLoading && !errorMessage && totalPuzzles === 0 ? (
        <section className="panel">
          <h2>Aucun puzzle disponible</h2>
          <p>
            Lance d’abord une analyse complète depuis l’onboarding pour générer des
            erreurs critiques.
          </p>
        </section>
      ) : null}

      {isSessionComplete ? (
        <section className="panel">
          <h2>Session terminée</h2>
          <p>Tu as parcouru tous les puzzles disponibles de cette session.</p>
          <p>
            Résolus: <strong>{solvedPuzzleIds.length}</strong> • Passés:{' '}
            <strong>{skippedPuzzleIds.length}</strong>
          </p>
          <p>
            {isPersistingSession
              ? 'Enregistrement du résumé...'
              : isSessionPersisted
                ? 'Résumé enregistré.'
                : 'Résumé non enregistré.'}
          </p>
          <p>
            <Link to="/progress">Ouvrir le résumé de progression</Link>
          </p>
        </section>
      ) : null}

      {currentPuzzle ? (
        <div className="grid puzzle-grid">
          <div
            className={[
              'puzzle-board-column',
              !showInfoPanel ? 'puzzle-board-column-compact' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Board
              key={`${currentPuzzle.puzzle_id}-${boardResetVersion}`}
              initialFen={currentPuzzle.fen}
              chrome="compact"
              subtitle={currentPuzzle.objective}
              // Highlight the source-game move until the user plays a move.
              lastMoveUci={lastMoveUci ?? currentPuzzle.context.played_move_uci}
              onMovePlayed={(move) => {
                setLastMoveSan(move.san);
                void handleMovePlayed(move.uci);
              }}
              isDisabled={isSubmittingAttempt}
              leftAccessory={showEvalBar ? <EvalBar evalPawns={liveEvalPawns} /> : null}
            />

            {isSubmittingAttempt ? (
              <p role="status" aria-live="polite" className="board-meta">
                Évaluation du coup en cours...
              </p>
            ) : null}

            {lastMoveSan ? (
              <p className="board-meta">
                Dernier coup joué: <strong>{lastMoveSan}</strong>
              </p>
            ) : null}

            {attemptResult ? (
              <ExplanationPanel
                status={attemptResult.status}
                attemptedMoveUci={attemptResult.attempted_move_uci}
                bestMoveUci={attemptResult.best_move_uci}
                attemptedMoveSan={attemptNotation?.attemptedSan}
                bestMoveSan={attemptNotation?.bestSan}
                wrongMoveExplanation={
                  attemptNotation?.wrongMoveExplanation ??
                  attemptResult.wrong_move_explanation
                }
                bestMoveExplanation={
                  attemptNotation?.bestMoveExplanation ??
                  attemptResult.best_move_explanation
                }
              />
            ) : null}

            {attemptResult ? (
              <div
                tabIndex={-1}
                role="status"
                className={[
                  'attempt-result',
                  attemptResult.is_correct
                    ? 'attempt-result-correct'
                    : 'attempt-result-incorrect',
                ].join(' ')}
              >
                <p>
                  <strong>{attemptResult.feedback_title}</strong>
                </p>
                <p>
                  {attemptNotation?.feedbackMessage ?? attemptResult.feedback_message}
                </p>
                <p>
                  Coup proposé:{' '}
                  <strong>
                    {uciToSan({
                      fen: currentPuzzle.fen,
                      uci: attemptResult.attempted_move_uci,
                    }) ?? attemptResult.attempted_move_uci}
                  </strong>{' '}
                  • meilleur coup:{' '}
                  <strong>
                    {uciToSan({
                      fen: currentPuzzle.fen,
                      uci: attemptResult.best_move_uci,
                    }) ?? attemptResult.best_move_uci}
                  </strong>
                </p>
                {attemptResult.retry_available ? (
                  <button className="auth-submit" type="button" onClick={handleRetry}>
                    Réessayer cette position
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {showInfoPanel ? (
            <div className="puzzle-side-column">
              <section className="panel" aria-live="polite">
                <h2>Infos</h2>
                <ul className="puzzle-context-list">
                  <li>Perte estimée: {currentPuzzle.context.eval_drop_cp} cp</li>
                  <li>
                    Adversaire:{' '}
                    <strong>
                      {currentPuzzle.context.opponent_username ??
                        currentPuzzle.context.chess_com_username ??
                        '—'}
                    </strong>
                  </li>
                  <li>
                    Date:{' '}
                    <strong>
                      {formatDateForInfo(
                        currentPuzzle.context.game_played_at ??
                          currentPuzzle.context.created_at,
                      )}
                    </strong>
                  </li>
                  <li>
                    Cadence:{' '}
                    <strong>{currentPuzzle.context.time_class ?? 'unknown'}</strong>
                  </li>
                </ul>
              </section>

              <section className="panel">
                <h2>Gain d’éval</h2>
                <p className="eval-gain-meta">
                  {lastMoveSan ? (
                    <>
                      Ton coup: <strong>{lastMoveSan}</strong>
                    </>
                  ) : (
                    'Joue un coup pour voir le gain.'
                  )}
                </p>
                <p className="eval-gain-value" aria-live="polite">
                  {evalGain == null ? (
                    <span className="eval-gain-placeholder">—</span>
                  ) : (
                    <>
                      {formatSigned(evalGain, 1)}{' '}
                      <span className="eval-gain-unit">pions</span>{' '}
                      <span className="eval-gain-cp">
                        ({formatSigned(Math.round(evalGain * 100), 0)} cp)
                      </span>
                    </>
                  )}
                </p>
              </section>

              <div className="puzzle-actions">
                <button
                  className="auth-submit import-submit-secondary"
                  type="button"
                  onClick={handleSkipPuzzle}
                  disabled={isSubmittingAttempt}
                >
                  Passer ce puzzle
                </button>
                <button
                  className="auth-submit"
                  type="button"
                  onClick={advanceToNextPuzzle}
                  disabled={!canContinueAfterSolve}
                >
                  Continuer au puzzle suivant
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
