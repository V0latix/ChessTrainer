import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { deleteAccountFromApi } from '../../lib/account-delete';
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
      setLogoutError(error instanceof Error ? error.message : 'Suppression du compte impossible.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero hero-row">
        <div>
          <h1>ChessTrainer</h1>
          <p>Bienvenue {session?.user.email ?? 'joueur'}. Onboarding authentifié prêt.</p>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout} disabled={isLoggingOut || isDeleting}>
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
          disabled={isDeleting || isLoggingOut}
        >
          {isDeleting ? 'Suppression...' : 'Supprimer mon compte'}
        </button>
      </section>
    </main>
  );
}
