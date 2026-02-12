import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout/AppLayout';
import { getProgressSummary, type ProgressSummaryResponse } from '../../lib/progress';
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

export function ProgressPage() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(Boolean(session?.access_token));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await getProgressSummary({
          accessToken: session.access_token,
        });

        if (cancelled) {
          return;
        }

        setSummary(result);
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSummary(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le résumé de progression.',
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

  const successIndicator = useMemo(() => {
    if (!summary || summary.success_rate_percent === null) {
      return 'N/A';
    }

    return `${summary.success_rate_percent}%`;
  }, [summary]);

  return (
    <AppLayout>
      <main className="app-shell">
      <header className="hero">
        <h1>Résumé de progression</h1>
        <p>Vue compacte de tes sessions récentes et de tes motifs d’erreurs.</p>
        <p className="hero-link-row">
          <Link to="/puzzle">Retour aux puzzles</Link>
        </p>
        <p className="hero-link-row">
          <Link to="/progress/trends">Voir les tendances</Link>
        </p>
        <p className="hero-link-row">
          <Link to="/data/inventory">Voir l’inventaire des données</Link>
        </p>
      </header>

      {isLoading ? (
        <p className="auth-message" role="status" aria-live="polite">
          Chargement du résumé...
        </p>
      ) : null}

      {errorMessage ? (
        <p className="auth-message auth-message-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && summary ? (
        <section className="grid progress-summary-grid">
          <article className="panel">
            <h2>Sessions complétées</h2>
            <p className="progress-kpi" data-testid="progress-sessions-completed">
              {summary.sessions_completed}
            </p>
            <p>Dernière session: {formatDate(summary.last_session_at)}</p>
          </article>

          <article className="panel">
            <h2>Puzzles complétés</h2>
            <p className="progress-kpi" data-testid="progress-puzzles-completed">
              {summary.puzzles_completed}
            </p>
            <p>
              Résolus: <strong>{summary.puzzles_solved}</strong> • Passés:{' '}
              <strong>{summary.puzzles_skipped}</strong>
            </p>
          </article>

          <article className="panel">
            <h2>Indicateur de réussite</h2>
            <p className="progress-kpi" data-testid="progress-success-rate">
              {successIndicator}
            </p>
            <p>Basé sur les sessions enregistrées.</p>
          </article>

          <article className="panel progress-mistakes-panel">
            <h2>Erreurs récurrentes</h2>
            {summary.recent_mistakes.length > 0 ? (
              <ul className="progress-mistakes-list">
                {summary.recent_mistakes.map((mistake) => (
                  <li key={mistake.category}>
                    <strong>{mistake.category}</strong> • {mistake.mistake_count} occurrences
                    • perte moyenne {mistake.average_eval_drop_cp} cp
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun motif d’erreur disponible pour le moment.</p>
            )}
          </article>
        </section>
      ) : null}
      </main>
    </AppLayout>
  );
}
