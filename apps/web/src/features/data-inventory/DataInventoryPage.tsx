import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDataInventory, type DataInventoryResponse } from '../../lib/data-inventory';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inventory, setInventory] = useState<DataInventoryResponse | null>(null);

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

  return (
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
        </section>
      ) : null}
    </main>
  );
}
