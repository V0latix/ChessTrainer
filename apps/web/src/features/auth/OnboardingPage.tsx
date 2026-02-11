import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { supabase } from '../../lib/supabase';
import { useAuth } from './auth-context';

type OnboardingPageProps = {
  onLoggedOut?: () => void;
};

export function OnboardingPage({ onLoggedOut }: OnboardingPageProps) {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  return (
    <main className="app-shell">
      <header className="hero hero-row">
        <div>
          <h1>ChessTrainer</h1>
          <p>Bienvenue {session?.user.email ?? 'joueur'}. Onboarding authentifié prêt.</p>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
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
    </main>
  );
}
