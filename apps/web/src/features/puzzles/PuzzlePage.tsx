import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { useAuth } from '../auth/auth-context';
import { getNextPuzzle, type NextPuzzleResponse } from '../../lib/puzzles';

export function PuzzlePage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<NextPuzzleResponse | null>(null);
  const [lastMoveUci, setLastMoveUci] = useState<string | null>(null);

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
            initialFen={puzzle.fen}
            title="Board"
            onMovePlayed={(uciMove) => setLastMoveUci(uciMove)}
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
          </section>
        </div>
      ) : null}
    </main>
  );
}
