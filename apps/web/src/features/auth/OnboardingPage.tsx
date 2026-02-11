import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { deleteAccountFromApi } from '../../lib/account-delete';
import {
  enqueueAnalysisJobs,
  getAnalysisJobStatus,
  type AnalysisJobStatusResponse,
  type EnqueueAnalysisJobsResponse,
} from '../../lib/analysis-jobs';
import {
  importSelectedChessComGames,
  listChessComCandidateGames,
  type CandidateGame,
  type ImportSelectedGamesResponse,
  type ReimportGamesResponse,
  reimportChessComGames,
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
  const [isReimportingGames, setIsReimportingGames] = useState(false);
  const [isEnqueuingAnalysis, setIsEnqueuingAnalysis] = useState(false);
  const [candidateGames, setCandidateGames] = useState<CandidateGame[]>([]);
  const [unavailablePeriods, setUnavailablePeriods] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<Record<string, boolean>>({});
  const [importSummary, setImportSummary] =
    useState<ImportSelectedGamesResponse | null>(null);
  const [reimportSummary, setReimportSummary] = useState<ReimportGamesResponse | null>(
    null,
  );
  const [analysisSummary, setAnalysisSummary] =
    useState<EnqueueAnalysisJobsResponse | null>(null);
  const [trackedAnalysisJobIds, setTrackedAnalysisJobIds] = useState<string[]>([]);
  const [analysisJobStatuses, setAnalysisJobStatuses] = useState<
    Record<string, AnalysisJobStatusResponse>
  >({});
  const [isPollingAnalysisStatus, setIsPollingAnalysisStatus] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(selectedGames).filter(Boolean).length,
    [selectedGames],
  );
  const analysisStatusItems = useMemo(
    () =>
      trackedAnalysisJobIds
        .map((jobId) => analysisJobStatuses[jobId])
        .filter((status): status is AnalysisJobStatusResponse => Boolean(status)),
    [trackedAnalysisJobIds, analysisJobStatuses],
  );
  const analysisAverageProgress = useMemo(() => {
    if (analysisStatusItems.length === 0) {
      return 0;
    }

    const total = analysisStatusItems.reduce(
      (accumulator, status) => accumulator + status.progress_percent,
      0,
    );

    return Math.round(total / analysisStatusItems.length);
  }, [analysisStatusItems]);
  const analysisEtaSeconds = useMemo(() => {
    const availableEta = analysisStatusItems
      .map((status) => status.eta_seconds)
      .filter((eta): eta is number => eta !== null);

    if (availableEta.length === 0) {
      return null;
    }

    return Math.max(...availableEta);
  }, [analysisStatusItems]);
  const analysisCompletedCount = useMemo(
    () => analysisStatusItems.filter((status) => status.status === 'completed').length,
    [analysisStatusItems],
  );
  const analysisFailedCount = useMemo(
    () => analysisStatusItems.filter((status) => status.status === 'failed').length,
    [analysisStatusItems],
  );
  const isAnalysisTrackingComplete = useMemo(() => {
    if (trackedAnalysisJobIds.length === 0) {
      return false;
    }

    if (analysisStatusItems.length !== trackedAnalysisJobIds.length) {
      return false;
    }

    return analysisStatusItems.every(
      (status) => status.status === 'completed' || status.status === 'failed',
    );
  }, [trackedAnalysisJobIds, analysisStatusItems]);

  useEffect(() => {
    if (!session?.access_token || trackedAnalysisJobIds.length === 0) {
      setIsPollingAnalysisStatus(false);
      return;
    }

    let isDisposed = false;
    let nextPollTimer: ReturnType<typeof setTimeout> | null = null;

    const runPoll = async () => {
      try {
        const statuses = await Promise.all(
          trackedAnalysisJobIds.map((jobId) =>
            getAnalysisJobStatus({
              accessToken: session.access_token,
              jobId,
            }),
          ),
        );

        if (isDisposed) {
          return;
        }

        setAnalysisJobStatuses((previous) => {
          const updated = { ...previous };
          for (const status of statuses) {
            updated[status.job_id] = status;
          }
          return updated;
        });

        const allTerminal = statuses.every(
          (status) => status.status === 'completed' || status.status === 'failed',
        );

        if (allTerminal) {
          setIsPollingAnalysisStatus(false);
          return;
        }

        nextPollTimer = setTimeout(() => {
          void runPoll();
        }, 2000);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        setIsPollingAnalysisStatus(false);
        setLogoutError(
          error instanceof Error
            ? error.message
            : 'Impossible de rafraîchir le statut des analyses.',
        );
      }
    };

    setIsPollingAnalysisStatus(true);
    void runPoll();

    return () => {
      isDisposed = true;
      if (nextPollTimer) {
        clearTimeout(nextPollTimer);
      }
    };
  }, [session?.access_token, trackedAnalysisJobIds]);

  function resetAnalysisTracking() {
    setAnalysisSummary(null);
    setTrackedAnalysisJobIds([]);
    setAnalysisJobStatuses({});
    setIsPollingAnalysisStatus(false);
  }

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
    setReimportSummary(null);
    resetAnalysisTracking();

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
    setReimportSummary(null);
    resetAnalysisTracking();

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

  async function handleReimportGames() {
    setLogoutError(null);
    setImportSummary(null);
    resetAnalysisTracking();

    if (!session?.access_token) {
      setLogoutError('Session invalide, reconnecte-toi puis réessaie.');
      return;
    }

    const username = chessComUsername.trim();

    if (!username) {
      setLogoutError('Renseigne ton pseudo Chess.com avant la réimportation.');
      return;
    }

    setIsReimportingGames(true);

    try {
      const summary = await reimportChessComGames({
        accessToken: session.access_token,
        username,
      });
      setReimportSummary(summary);
      setUnavailablePeriods(
        summary.unavailable_periods.map((period) => `${period.period} (${period.reason})`),
      );
    } catch (error) {
      setReimportSummary(null);
      setLogoutError(
        error instanceof Error ? error.message : 'Réimport des parties impossible.',
      );
    } finally {
      setIsReimportingGames(false);
    }
  }

  async function handleEnqueueAnalysis() {
    setLogoutError(null);

    if (!session?.access_token) {
      setLogoutError('Session invalide, reconnecte-toi puis réessaie.');
      return;
    }

    setIsEnqueuingAnalysis(true);
    resetAnalysisTracking();

    try {
      const summary = await enqueueAnalysisJobs({
        accessToken: session.access_token,
      });
      setAnalysisSummary(summary);
      setTrackedAnalysisJobIds(summary.jobs.map((job) => job.job_id));
      setAnalysisJobStatuses(
        summary.jobs.reduce<Record<string, AnalysisJobStatusResponse>>((accumulator, job) => {
          accumulator[job.job_id] = {
            job_id: job.job_id,
            game_id: job.game_id,
            status: job.status,
            progress_percent: 0,
            eta_seconds: null,
            started_at: null,
            completed_at: null,
            error_code: null,
            error_message: null,
            updated_at: job.created_at,
          };

          return accumulator;
        }, {}),
      );
    } catch (error) {
      resetAnalysisTracking();
      setLogoutError(
        error instanceof Error ? error.message : 'Mise en file des analyses impossible.',
      );
    } finally {
      setIsEnqueuingAnalysis(false);
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
          <p className="hero-link-row">
            <Link to="/puzzle">Ouvrir un puzzle basé sur mes erreurs</Link>
          </p>
          <p className="hero-link-row">
            <Link to="/progress">Voir mon résumé de progression</Link>
          </p>
          <p className="hero-link-row">
            <Link to="/data/inventory">Voir l’inventaire des données</Link>
          </p>
          <p className="hero-link-row">
            <Link to="/coach/context">Espace coach (contexte élève)</Link>
          </p>
        </div>
        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
          disabled={
            isLoggingOut ||
            isDeleting ||
            isFetchingGames ||
            isImportingGames ||
            isReimportingGames ||
            isEnqueuingAnalysis
          }
        >
          {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </button>
      </header>

      {logoutError ? <p className="auth-message auth-message-error">{logoutError}</p> : null}

      <div className="grid">
        <Board />
        <Puzzle />
        <ExplanationPanel
          status="incorrect"
          attemptedMoveUci="h1h2"
          bestMoveUci="h1g1"
          wrongMoveExplanation="Exemple: ce coup perd le contrôle des cases clés autour du roi."
          bestMoveExplanation="Exemple: ce coup améliore l’activité des pièces et neutralise la menace."
        />
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
            disabled={
              isFetchingGames || isDeleting || isImportingGames || isReimportingGames
            }
          >
            {isFetchingGames ? 'Récupération...' : 'Lister mes parties'}
          </button>
        </form>

        <button
          className="auth-submit import-submit import-submit-secondary"
          type="button"
          onClick={handleReimportGames}
          disabled={
            isReimportingGames ||
            isDeleting ||
            isFetchingGames ||
            isImportingGames ||
            isEnqueuingAnalysis
          }
        >
          {isReimportingGames
            ? 'Réimport en cours...'
            : 'Réimporter sans doublons (parties récentes)'}
        </button>

        <button
          className="auth-submit import-submit import-submit-secondary"
          type="button"
          onClick={handleEnqueueAnalysis}
          disabled={
            isEnqueuingAnalysis ||
            isDeleting ||
            isFetchingGames ||
            isImportingGames ||
            isReimportingGames
          }
        >
          {isEnqueuingAnalysis
            ? 'Mise en file...'
            : 'Démarrer l’analyse asynchrone (parties importées)'}
        </button>

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
              disabled={
                isImportingGames || isDeleting || isFetchingGames || isReimportingGames
              }
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

        {reimportSummary ? (
          <div className="import-summary">
            <p>Réimport terminé pour {reimportSummary.username}.</p>
            <p>Parties scannées: {reimportSummary.scanned_count}</p>
            <p>Nouvelles importées: {reimportSummary.imported_count}</p>
            <p>Déjà existantes: {reimportSummary.already_existing_count}</p>
            <p>Échecs: {reimportSummary.failed_count}</p>
          </div>
        ) : null}

        {analysisSummary ? (
          <div className="import-summary">
            <p>Analyse lancée.</p>
            <p>Jobs créés: {analysisSummary.enqueued_count}</p>
            <p>Jobs ignorés (déjà en cours): {analysisSummary.skipped_count}</p>
            {trackedAnalysisJobIds.length > 0 ? (
              <>
                <p>
                  Suivi des jobs: {analysisStatusItems.length}/{trackedAnalysisJobIds.length}
                </p>
                <p>Progression moyenne: {analysisAverageProgress}%</p>
                <progress
                  className="analysis-progress"
                  value={analysisAverageProgress}
                  max={100}
                  aria-label="Progression moyenne de l’analyse"
                />
                <p>
                  ETA: {analysisEtaSeconds === null ? 'calcul en cours...' : `${analysisEtaSeconds}s`}
                </p>
                <p>
                  Jobs terminés: {analysisCompletedCount} • Échecs: {analysisFailedCount}
                </p>
                {isAnalysisTrackingComplete ? (
                  <p>Toutes les analyses suivies sont terminées.</p>
                ) : null}
                {isPollingAnalysisStatus ? <p>Suivi en cours...</p> : null}
              </>
            ) : null}
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
          disabled={
            isDeleting ||
            isLoggingOut ||
            isFetchingGames ||
            isImportingGames ||
            isReimportingGames ||
            isEnqueuingAnalysis
          }
        >
          {isDeleting ? 'Suppression...' : 'Supprimer mon compte'}
        </button>
      </section>
    </main>
  );
}
