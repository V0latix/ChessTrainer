import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout/AppLayout';
import {
  deleteStoredDatasets,
  getDataInventory,
  type DataInventoryResponse,
  type DeleteDatasetsResponse,
} from '../../lib/data-inventory';
import { useAuth } from '../auth/auth-context';

function formatDate(value: string | null) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function DataInventoryPage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inventory, setInventory] = useState<DataInventoryResponse | null>(null);
  const [deletionResult, setDeletionResult] = useState<DeleteDatasetsResponse | null>(
    null,
  );
  const [selectedDatasets, setSelectedDatasets] = useState({
    games: false,
    analyses: false,
    puzzle_sessions: false,
  });
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await getDataInventory({
          accessToken: session.access_token,
        });

        if (cancelled) {
          return;
        }

        setInventory(result);
        setDeletionResult(null);
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setInventory(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger l’inventaire des données.',
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
  }, [session?.access_token]);

  async function handleDeleteDatasets() {
    if (!session?.access_token || !inventory) {
      return;
    }

    const datasetKeys = (
      Object.entries(selectedDatasets) as Array<
        [keyof typeof selectedDatasets, boolean]
      >
    )
      .filter(([, selected]) => selected)
      .map(([datasetKey]) => datasetKey);

    if (datasetKeys.length === 0) {
      setErrorMessage('Sélectionne au moins un dataset à supprimer.');
      return;
    }

    if (!deleteConfirmed) {
      setErrorMessage('Confirme la suppression avant de continuer.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const deletion = await deleteStoredDatasets({
        accessToken: session.access_token,
        datasetKeys,
      });

      setDeletionResult(deletion);
      const refreshed = await getDataInventory({
        accessToken: session.access_token,
      });
      setInventory(refreshed);
      setDeleteConfirmed(false);
      setSelectedDatasets({
        games: false,
        analyses: false,
        puzzle_sessions: false,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de supprimer les datasets sélectionnés.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppLayout>
      <main className="app-shell">
      <header className="hero">
        <h1>Inventaire des données</h1>
        <p>Transparence sur les données stockées pour ton compte.</p>
        <p className="hero-link-row">
          <Link to="/progress">Retour au résumé</Link>
        </p>
      </header>

      {isLoading ? (
        <p className="auth-message" role="status" aria-live="polite">
          Chargement de l’inventaire...
        </p>
      ) : null}

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && inventory ? (
        <section className="grid data-inventory-grid">
          <article className="panel">
            <h2>Parties stockées</h2>
            <p className="progress-kpi" data-testid="inventory-games-count">
              {inventory.counts.games_count}
            </p>
            <p>Derniére importation: {formatDate(inventory.latest_updates.last_game_import?.imported_at ?? null)}</p>
          </article>

          <article className="panel">
            <h2>Analyses stockées</h2>
            <p className="progress-kpi" data-testid="inventory-analyses-count">
              {inventory.counts.analyses_count}
            </p>
            <p>
              Dernière mise à jour: {formatDate(inventory.latest_updates.last_analysis_update?.updated_at ?? null)}
            </p>
          </article>

          <article className="panel">
            <h2>Détails analyses</h2>
            <p>
              Évaluations de coups: <strong>{inventory.counts.move_evaluations_count}</strong>
            </p>
            <p>
              Erreurs critiques: <strong>{inventory.counts.critical_mistakes_count}</strong>
            </p>
            <p>
              Sessions puzzle: <strong>{inventory.counts.puzzle_sessions_count}</strong>
            </p>
          </article>

          <article className="panel">
            <h2>Contexte récent</h2>
            <p>
              Dernière partie:{' '}
              <strong>{inventory.latest_updates.last_game_import?.game_url ?? 'N/A'}</strong>
            </p>
            <p>
              Dernière analyse:{' '}
              <strong>
                {inventory.latest_updates.last_analysis_update?.status ?? 'N/A'}
              </strong>
            </p>
            <p>
              Dernier motif erreur:{' '}
              <strong>
                {inventory.latest_updates.last_mistake_update?.category ?? 'N/A'}
              </strong>
            </p>
          </article>

          <section className="danger-zone data-delete-zone">
            <h2>Supprimer des datasets</h2>
            <p>
              Choisis les données à supprimer. Cette action met à jour
              l’inventaire et les métriques de progression associées.
            </p>
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={selectedDatasets.games}
                onChange={(event) =>
                  setSelectedDatasets((previous) => ({
                    ...previous,
                    games: event.target.checked,
                  }))
                }
                disabled={isDeleting}
              />
              <span>Supprimer les parties (et données d’analyse liées)</span>
            </label>
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={selectedDatasets.analyses}
                onChange={(event) =>
                  setSelectedDatasets((previous) => ({
                    ...previous,
                    analyses: event.target.checked,
                  }))
                }
                disabled={isDeleting}
              />
              <span>Supprimer uniquement les analyses</span>
            </label>
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={selectedDatasets.puzzle_sessions}
                onChange={(event) =>
                  setSelectedDatasets((previous) => ({
                    ...previous,
                    puzzle_sessions: event.target.checked,
                  }))
                }
                disabled={isDeleting}
              />
              <span>Supprimer les sessions puzzle stockées</span>
            </label>
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(event) => setDeleteConfirmed(event.target.checked)}
                disabled={isDeleting}
              />
              <span>Je confirme vouloir supprimer ces datasets.</span>
            </label>
            <button
              className="delete-button"
              type="button"
              onClick={() => {
                void handleDeleteDatasets();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer les datasets sélectionnés'}
            </button>

            {deletionResult ? (
              <div className="data-delete-summary" data-testid="data-delete-summary">
                <p>
                  Datasets supprimés: {deletionResult.deleted_datasets.join(', ')}
                </p>
                <p>
                  Suppressions effectives: parties {deletionResult.deleted_counts.games_count}
                  , analyses {deletionResult.deleted_counts.analyses_count}, erreurs{' '}
                  {deletionResult.deleted_counts.critical_mistakes_count}.
                </p>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}
      </main>
    </AppLayout>
  );
}
