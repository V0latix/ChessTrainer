import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import {
  evaluatePuzzleAttempt,
  getNextPuzzle,
  type EvaluatePuzzleAttemptResponse,
  type NextPuzzleResponse,
} from '../../lib/puzzles';
import { useAuth } from '../auth/auth-context';

export function PuzzlePage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<NextPuzzleResponse | null>(null);
  const [lastMoveUci, setLastMoveUci] = useState<string | null>(null);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [attemptResult, setAttemptResult] =
    useState<EvaluatePuzzleAttemptResponse | null>(null);
  const [boardResetVersion, setBoardResetVersion] = useState(0);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        const result = await getNextPuzzle({ accessToken: session.access_token });
        if (isCancelled) {
          return;
        }

        setPuzzle(result);
        setLastMoveUci(null);
        setAttemptResult(null);
        setBoardResetVersion(0);
        setErrorMessage(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setPuzzle(null);
        setErrorMessage(
          error instanceof Error ? error.message : 'Impossible de charger le puzzle.',
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
    if (!session?.access_token || !puzzle || isSubmittingAttempt || attemptResult) {
      return;
    }

    setLastMoveUci(uciMove);
    setErrorMessage(null);
    setIsSubmittingAttempt(true);

    try {
      const result = await evaluatePuzzleAttempt({
        accessToken: session.access_token,
        puzzleId: puzzle.puzzle_id,
        attemptedMoveUci: uciMove,
      });
      setAttemptResult(result);
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

  function handleRetry() {
    setAttemptResult(null);
    setLastMoveUci(null);
    setErrorMessage(null);
    setBoardResetVersion((previous) => previous + 1);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>Puzzle de tes erreurs</h1>
        <p>Rejoue une position critique issue de tes parties importées.</p>
        <p>
          <Link to="/onboarding">Retour à l’onboarding</Link>
        </p>
      </header>

      {!session?.access_token ? (
        <p className="auth-message auth-message-error">
          Session invalide, reconnecte-toi puis réessaie.
        </p>
      ) : null}

      {isLoading ? <p className="auth-message">Chargement du puzzle...</p> : null}
      {errorMessage ? <p className="auth-message auth-message-error">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && !puzzle ? (
        <section className="panel">
          <h2>Aucun puzzle disponible</h2>
          <p>
            Lance d’abord une analyse complète depuis l’onboarding pour générer des
            erreurs critiques.
          </p>
        </section>
      ) : null}

      {puzzle ? (
        <div className="grid puzzle-grid">
          <Board
            key={`${puzzle.puzzle_id}-${boardResetVersion}`}
            initialFen={puzzle.fen}
            title="Board"
            onMovePlayed={(uciMove) => {
              void handleMovePlayed(uciMove);
            }}
            isDisabled={isSubmittingAttempt || Boolean(attemptResult)}
          />
          <Puzzle
            objective={puzzle.objective}
            source={puzzle.source}
            context={puzzle.context}
          />
          <section className="panel">
            <h2>Contexte du coup</h2>
            <p>
              Pseudo Chess.com: <strong>{puzzle.context.chess_com_username}</strong>
            </p>
            <p>
              Période: <strong>{puzzle.context.period}</strong> • Format:{' '}
              <strong>{puzzle.context.time_class ?? 'unknown'}</strong>
            </p>
            <p>
              Position critique au demi-coup <strong>{puzzle.context.ply_index}</strong>.
            </p>
            {lastMoveUci ? (
              <p>
                Dernier coup joué sur le board: <strong>{lastMoveUci}</strong>
              </p>
            ) : (
              <p>Joue un coup sur le board pour démarrer.</p>
            )}
            {isSubmittingAttempt ? <p>Évaluation du coup en cours...</p> : null}
            {attemptResult ? (
              <div
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
          </section>
        </div>
      ) : null}
    </main>
  );
}
