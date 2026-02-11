import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProgressTrends, type ProgressTrendsResponse } from '../../lib/progress';
import { useAuth } from '../auth/auth-context';

function trendLabel(direction: 'up' | 'down' | 'stable' | 'new') {
  if (direction === 'up') {
    return 'Hausse';
  }

  if (direction === 'down') {
    return 'Baisse';
  }

  if (direction === 'new') {
    return 'Nouveau';
  }

  return 'Stable';
}

export function ProgressTrendsPage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trends, setTrends] = useState<ProgressTrendsResponse | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await getProgressTrends({
          accessToken: session.access_token,
          days: 14,
          limit: 8,
        });

        if (cancelled) {
          return;
        }

        setTrends(result);
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTrends(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger les tendances.',
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
        <h1>Tendances d’erreurs</h1>
        <p>Classement des motifs récurrents et évolution récente.</p>
        <p className="hero-link-row">
          <Link to="/progress">Retour au résumé</Link>
        </p>
        <p className="hero-link-row">
          <Link to="/data/inventory">Voir l’inventaire des données</Link>
        </p>
      </header>

      {isLoading ? (
        <p className="auth-message" role="status" aria-live="polite">
          Chargement des tendances...
        </p>
      ) : null}

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && trends ? (
        <section className="panel">
          <h2>
            Fenêtre: {trends.window_days} jours (comparé aux {trends.compared_to_days}{' '}
            jours précédents)
          </h2>

          {trends.categories.length > 0 ? (
            <ol className="trend-list">
              {trends.categories.map((item) => (
                <li key={item.category} className="trend-list-item">
                  <div>
                    <p className="trend-title">
                      <strong>{item.category}</strong>
                    </p>
                    <p className="trend-meta">
                      récent: {item.recent_count} • avant: {item.previous_count} •
                      delta: {item.delta_count >= 0 ? '+' : ''}
                      {item.delta_count}
                    </p>
                  </div>
                  <span
                    className={[
                      'trend-badge',
                      `trend-badge-${item.trend_direction}`,
                    ].join(' ')}
                    data-testid={`trend-direction-${item.category}`}
                  >
                    {trendLabel(item.trend_direction)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>Aucune tendance exploitable pour le moment.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
