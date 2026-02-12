import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout/AppLayout';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import {
  getCoachReviewMistakes,
  importCoachStudentGames,
  type CoachReviewImportResponse,
  type CoachReviewMistake,
} from '../../lib/coach-review';
import { readSelectedCoachContext } from '../../lib/coach-context';
import { useAuth } from '../auth/auth-context';

export function CoachReviewPage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<CoachReviewMistake[]>([]);
  const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<CoachReviewImportResponse | null>(
    null,
  );
  const [chessComUsername, setChessComUsername] = useState('');

  const selectedContext = useMemo(() => readSelectedCoachContext(), []);

  useEffect(() => {
    if (!session?.access_token || !selectedContext) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await getCoachReviewMistakes({
          accessToken: session.access_token,
          studentUserId: selectedContext.student_user_id,
          limit: 12,
        });

        if (cancelled) {
          return;
        }

        setMistakes(result.mistakes);
        setSelectedMistakeId(result.mistakes[0]?.mistake_id ?? null);
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMistakes([]);
        setSelectedMistakeId(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger les erreurs de l’élève.',
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, selectedContext]);

  const selectedMistake = useMemo(
    () =>
      mistakes.find((mistake) => mistake.mistake_id === selectedMistakeId) ?? null,
    [mistakes, selectedMistakeId],
  );

  async function handleImport() {
    if (!session?.access_token || !selectedContext) {
      return;
    }

    const username = chessComUsername.trim();
    if (!username) {
      setErrorMessage('Renseigne un pseudo Chess.com avant l’import.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const summary = await importCoachStudentGames({
        accessToken: session.access_token,
        studentUserId: selectedContext.student_user_id,
        chessComUsername: username,
      });
      setImportSummary(summary);

      const refreshed = await getCoachReviewMistakes({
        accessToken: session.access_token,
        studentUserId: selectedContext.student_user_id,
        limit: 12,
      });
      setMistakes(refreshed.mistakes);
      setSelectedMistakeId(refreshed.mistakes[0]?.mistake_id ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Import élève impossible.',
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <AppLayout>
      <main className="app-shell">
      <header className="hero">
        <h1>Coach Review</h1>
        <p>Importe et revois les erreurs clés de l’élève sélectionné.</p>
        <p className="hero-link-row">
          <Link to="/coach/context">Changer de contexte élève</Link>
        </p>
      </header>

      {!selectedContext ? (
        <section className="panel">
          <h2>Contexte manquant</h2>
          <p>
            Sélectionne d’abord un élève depuis l’espace coach avant d’ouvrir la
            review.
          </p>
          <p className="hero-link-row">
            <Link to="/coach/context">Ouvrir le contexte coach</Link>
          </p>
        </section>
      ) : null}

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {selectedContext ? (
        <section className="import-zone">
          <h2>Import élève</h2>
          <p>
            Élève actif: <strong>{selectedContext.student_user_id}</strong>
          </p>
          <label className="auth-label" htmlFor="coach-chess-com-username">
            Pseudo Chess.com de l’élève
          </label>
          <input
            id="coach-chess-com-username"
            className="auth-input"
            type="text"
            value={chessComUsername}
            onChange={(event) => setChessComUsername(event.target.value)}
            placeholder="ex: leoChess"
          />
          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              void handleImport();
            }}
            disabled={isImporting}
          >
            {isImporting ? 'Import en cours...' : 'Importer les parties de l’élève'}
          </button>
          {importSummary ? (
            <p data-testid="coach-import-summary">
              Import: {importSummary.imported_count} nouvelles,{' '}
              {importSummary.already_existing_count} déjà présentes.
            </p>
          ) : null}
        </section>
      ) : null}

      {isLoading ? <p className="auth-message">Chargement des erreurs...</p> : null}

      {selectedContext && !isLoading && mistakes.length === 0 ? (
        <section className="panel">
          <h2>Aucune erreur disponible</h2>
          <p>
            Lance un import/analyse pour cet élève afin d’afficher ses erreurs
            critiques.
          </p>
        </section>
      ) : null}

      {selectedContext && mistakes.length > 0 ? (
        <div className="grid coach-review-grid">
          <section className="panel">
            <h2>Erreurs clés</h2>
            <ul className="coach-mistake-list">
              {mistakes.map((mistake) => (
                <li key={mistake.mistake_id} className="coach-mistake-item">
                  <div>
                    <p>
                      <strong>{mistake.category}</strong>
                    </p>
                    <p>
                      {mistake.severity} • {mistake.eval_drop_cp} cp • ply{' '}
                      {mistake.ply_index}
                    </p>
                  </div>
                  <button
                    className="auth-submit"
                    type="button"
                    onClick={() => setSelectedMistakeId(mistake.mistake_id)}
                  >
                    Ouvrir
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selectedMistake ? (
            <div className="puzzle-board-column">
              <Board
                key={selectedMistake.mistake_id}
                initialFen={selectedMistake.fen}
                title="Board (élève)"
                isDisabled
              />
              <ExplanationPanel
                status="incorrect"
                attemptedMoveUci={selectedMistake.played_move_uci}
                bestMoveUci={selectedMistake.best_move_uci}
                wrongMoveExplanation={selectedMistake.wrong_move_explanation}
                bestMoveExplanation={selectedMistake.best_move_explanation}
              />
              <section className="panel">
                <h2>Contexte de l’erreur</h2>
                <p>
                  Partie:{' '}
                  <a
                    href={selectedMistake.game_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedMistake.game_url}
                  </a>
                </p>
                <p>
                  Joueur Chess.com:{' '}
                  <strong>{selectedMistake.chess_com_username}</strong>
                </p>
                <p>
                  Phase: <strong>{selectedMistake.phase}</strong> • catégorie:{' '}
                  <strong>{selectedMistake.category}</strong>
                </p>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
      </main>
    </AppLayout>
  );
}
