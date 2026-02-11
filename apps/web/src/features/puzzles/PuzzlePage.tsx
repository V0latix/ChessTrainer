import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { recordPuzzleSession } from '../../lib/progress';
import {
  evaluatePuzzleAttempt,
  getPuzzleSession,
  type EvaluatePuzzleAttemptResponse,
  type NextPuzzleResponse,
} from '../../lib/puzzles';
import { useAuth } from '../auth/auth-context';

export function PuzzlePage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionPuzzles, setSessionPuzzles] = useState<NextPuzzleResponse[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [lastMoveUci, setLastMoveUci] = useState<string | null>(null);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [attemptResult, setAttemptResult] =
    useState<EvaluatePuzzleAttemptResponse | null>(null);
  const [boardResetVersion, setBoardResetVersion] = useState(0);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>([]);
  const [skippedPuzzleIds, setSkippedPuzzleIds] = useState<string[]>([]);
  const [isPersistingSession, setIsPersistingSession] = useState(false);
  const [isSessionPersisted, setIsSessionPersisted] = useState(false);
  const attemptFeedbackRef = useRef<HTMLDivElement | null>(null);

  const currentPuzzle = sessionPuzzles[currentPuzzleIndex] ?? null;
  const isSessionComplete =
    sessionPuzzles.length > 0 && currentPuzzleIndex >= sessionPuzzles.length;
  const totalPuzzles = sessionPuzzles.length;
  const completedPuzzles = Math.min(currentPuzzleIndex, totalPuzzles);
  const currentPositionLabel = isSessionComplete
    ? `${totalPuzzles}/${totalPuzzles}`
    : `${Math.min(currentPuzzleIndex + 1, totalPuzzles)}/${totalPuzzles}`;

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        const result = await getPuzzleSession({
          accessToken: session.access_token,
          limit: 10,
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
  }, [session?.access_token]);

  async function handleMovePlayed(uciMove: string) {
    if (
      !session?.access_token ||
      !currentPuzzle ||
      isSubmittingAttempt ||
      attemptResult
    ) {
      return;
    }

    setLastMoveUci(uciMove);
    setErrorMessage(null);
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
    setErrorMessage(null);
    setBoardResetVersion(0);
    setCurrentPuzzleIndex((previous) => previous + 1);
  }

  function handleRetry() {
    setAttemptResult(null);
    setLastMoveUci(null);
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

  useEffect(() => {
    if (!attemptResult) {
      return;
    }

    attemptFeedbackRef.current?.focus();
  }, [attemptResult]);

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

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>Session de puzzles</h1>
        <p>Rejoue une séquence de positions critiques issues de tes parties.</p>
        <p>
          <Link to="/onboarding">Retour à l’onboarding</Link>
        </p>
        <p>
          <Link to="/progress">Voir mon résumé de progression</Link>
        </p>
      </header>

      {!session?.access_token ? (
        <p className="auth-message auth-message-error">
          Session invalide, reconnecte-toi puis réessaie.
        </p>
      ) : null}

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
          <div className="puzzle-board-column">
            <Board
              key={`${currentPuzzle.puzzle_id}-${boardResetVersion}`}
              initialFen={currentPuzzle.fen}
              title="Board"
              onMovePlayed={(uciMove) => {
                void handleMovePlayed(uciMove);
              }}
              isDisabled={isSubmittingAttempt || Boolean(attemptResult)}
            />
            {attemptResult ? (
              <ExplanationPanel
                status={attemptResult.status}
                attemptedMoveUci={attemptResult.attempted_move_uci}
                bestMoveUci={attemptResult.best_move_uci}
                wrongMoveExplanation={attemptResult.wrong_move_explanation}
                bestMoveExplanation={attemptResult.best_move_explanation}
              />
            ) : null}
          </div>
          <Puzzle
            objective={currentPuzzle.objective}
            source={currentPuzzle.source}
            context={currentPuzzle.context}
          />
          <section className="panel" aria-live="polite">
            <h2>Contexte du coup</h2>
            <p>
              Pseudo Chess.com:{' '}
              <strong>{currentPuzzle.context.chess_com_username}</strong>
            </p>
            <p>
              Période: <strong>{currentPuzzle.context.period}</strong> • Format:{' '}
              <strong>{currentPuzzle.context.time_class ?? 'unknown'}</strong>
            </p>
            <p>
              Position critique au demi-coup{' '}
              <strong>{currentPuzzle.context.ply_index}</strong>.
            </p>
            {lastMoveUci ? (
              <p>
                Dernier coup joué sur le board: <strong>{lastMoveUci}</strong>
              </p>
            ) : (
              <p>Joue un coup sur le board pour démarrer.</p>
            )}
            {isSubmittingAttempt ? (
              <p role="status" aria-live="polite">
                Évaluation du coup en cours...
              </p>
            ) : null}
            {attemptResult ? (
              <div
                ref={attemptFeedbackRef}
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
                <p>{attemptResult.feedback_message}</p>
                <p>
                  Coup proposé: <strong>{attemptResult.attempted_move_uci}</strong> •
                  meilleur coup: <strong>{attemptResult.best_move_uci}</strong>
                </p>
                {attemptResult.retry_available ? (
                  <button className="auth-submit" type="button" onClick={handleRetry}>
                    Réessayer cette position
                  </button>
                ) : null}
              </div>
            ) : null}

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
          </section>
        </div>
      ) : null}
    </main>
  );
}
