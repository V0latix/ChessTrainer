import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { deleteAccountFromApi } from '../../lib/account-delete';
import {
  importSelectedChessComGames,
  listChessComCandidateGames,
  type CandidateGame,
  type ImportSelectedGamesResponse,
} from '../../lib/chess-com';
import { supabase } from '../../lib/supabase';
import { useAuth } from './auth-context';

type OnboardingPageProps = {
  onLoggedOut?: () => void;
};

export function OnboardingPage({ onLoggedOut }: OnboardingPageProps) {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const [chessComUsername, setChessComUsername] = useState('');
  const [isFetchingGames, setIsFetchingGames] = useState(false);
  const [isImportingGames, setIsImportingGames] = useState(false);
  const [candidateGames, setCandidateGames] = useState<CandidateGame[]>([]);
  const [unavailablePeriods, setUnavailablePeriods] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<Record<string, boolean>>({});
  const [importSummary, setImportSummary] =
    useState<ImportSelectedGamesResponse | null>(null);

  const selectedCount = useMemo(
    () => Object.values(selectedGames).filter(Boolean).length,
    [selectedGames],
  );

  async function handleLogout() {
    setLogoutError(null);

    if (!supabase) {
      setLogoutError('Configuration Supabase manquante.');
      return;
    }

    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setIsLoggingOut(false);

    if (error) {
      setLogoutError(error.message);
      return;
    }

    if (onLoggedOut) {
      onLoggedOut();
      return;
    }

    navigate('/login', { replace: true });
  }

  async function handleDeleteAccount() {
    setLogoutError(null);

    if (!isDeleteConfirmed) {
      setLogoutError('Confirme la suppression du compte avant de continuer.');
      return;
    }

    if (!session?.access_token) {
      setLogoutError('Session invalide, reconnecte-toi puis réessaie.');
      return;
    }

    if (!supabase) {
      setLogoutError('Configuration Supabase manquante.');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAccountFromApi(session.access_token);
      await supabase.auth.signOut();

      if (onLoggedOut) {
        onLoggedOut();
        return;
      }

      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Suppression du compte impossible.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleFetchCandidateGames(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLogoutError(null);
    setImportSummary(null);

    if (!session?.access_token) {
      setLogoutError('Session invalide, reconnecte-toi puis réessaie.');
      return;
    }

    setIsFetchingGames(true);

    try {
      const result = await listChessComCandidateGames(
        session.access_token,
        chessComUsername.trim(),
      );
      setCandidateGames(result.candidate_games);
      setUnavailablePeriods(
        result.unavailable_periods.map((period) => `${period.period} (${period.reason})`),
      );
      setSelectedGames({});
    } catch (error) {
      setCandidateGames([]);
      setUnavailablePeriods([]);
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Impossible de récupérer les parties Chess.com.',
      );
    } finally {
      setIsFetchingGames(false);
    }
  }

  async function handleImportSelectedGames() {
    setLogoutError(null);

    if (!session?.access_token) {
      setLogoutError('Session invalide, reconnecte-toi puis réessaie.');
      return;
    }

    const selectedGameUrls = Object.entries(selectedGames)
      .filter(([, isSelected]) => isSelected)
      .map(([gameUrl]) => gameUrl);

    if (selectedGameUrls.length === 0) {
      setLogoutError('Sélectionne au moins une partie avant import.');
      return;
    }

    setIsImportingGames(true);

    try {
      const summary = await importSelectedChessComGames({
        accessToken: session.access_token,
        username: chessComUsername.trim(),
        selectedGameUrls,
      });
      setImportSummary(summary);
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Import des parties impossible.',
      );
    } finally {
      setIsImportingGames(false);
    }
  }

  function toggleGameSelection(gameUrl: string) {
    setSelectedGames((previous) => ({
      ...previous,
      [gameUrl]: !previous[gameUrl],
    }));
  }

  return (
    <main className="app-shell">
      <header className="hero hero-row">
        <div>
          <h1>ChessTrainer</h1>
          <p>Bienvenue {session?.user.email ?? 'joueur'}. Onboarding authentifié prêt.</p>
        </div>
        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut || isDeleting || isFetchingGames || isImportingGames}
        >
          {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </button>
      </header>

      {logoutError ? <p className="auth-message auth-message-error">{logoutError}</p> : null}

      <div className="grid">
        <Board />
        <Puzzle />
        <ExplanationPanel />
        <ProgressSummary />
      </div>

      <section className="import-zone">
        <h2>Importer depuis Chess.com</h2>
        <p>Récupère tes parties récentes pour choisir celles à importer.</p>

        <form className="import-form" onSubmit={handleFetchCandidateGames}>
          <label className="auth-label" htmlFor="chess-com-username">
            Pseudo Chess.com
          </label>
          <input
            id="chess-com-username"
            type="text"
            className="auth-input"
            placeholder="ex: v0latix"
            value={chessComUsername}
            onChange={(event) => setChessComUsername(event.target.value)}
            required
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={isFetchingGames || isDeleting || isImportingGames}
          >
            {isFetchingGames ? 'Récupération...' : 'Lister mes parties'}
          </button>
        </form>

        {candidateGames.length > 0 ? (
          <>
            <p className="import-meta">Parties candidates: {candidateGames.length}</p>
            <p className="import-meta">Sélectionnées: {selectedCount}</p>
            <ul className="candidate-list">
              {candidateGames.map((game) => (
                <li key={game.game_url} className="candidate-item">
                  <label className="candidate-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedGames[game.game_url])}
                      onChange={() => toggleGameSelection(game.game_url)}
                    />
                    <span>
                      {game.white_username ?? 'white'} vs {game.black_username ?? 'black'} •{' '}
                      {game.time_class ?? 'unknown'} • {game.period}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <button
              className="auth-submit import-submit"
              type="button"
              onClick={handleImportSelectedGames}
              disabled={isImportingGames || isDeleting || isFetchingGames}
            >
              {isImportingGames ? 'Import en cours...' : 'Importer la sélection'}
            </button>
          </>
        ) : null}

        {importSummary ? (
          <div className="import-summary">
            <p>Import terminé pour {importSummary.username}.</p>
            <p>Succès: {importSummary.imported_count}</p>
            <p>Déjà existantes: {importSummary.already_existing_count}</p>
            <p>Échecs: {importSummary.failed_count}</p>
          </div>
        ) : null}

        {unavailablePeriods.length > 0 ? (
          <div className="import-warning">
            <p>Périodes indisponibles:</p>
            <ul>
              {unavailablePeriods.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="danger-zone">
        <h2>Zone sensible</h2>
        <p>Supprimer ton compte efface toutes tes données ChessTrainer liées au profil.</p>

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={isDeleteConfirmed}
            onChange={(event) => setIsDeleteConfirmed(event.target.checked)}
          />
          <span>Je confirme vouloir supprimer définitivement mon compte.</span>
        </label>

        <button
          className="delete-button"
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting || isLoggingOut || isFetchingGames || isImportingGames}
        >
          {isDeleting ? 'Suppression...' : 'Supprimer mon compte'}
        </button>
      </section>
    </main>
  );
}
