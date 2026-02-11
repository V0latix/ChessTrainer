import { Board } from '../../components/Board/Board';
import { ExplanationPanel } from '../../components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from '../../components/ProgressSummary/ProgressSummary';
import { Puzzle } from '../../components/Puzzle/Puzzle';
import { useAuth } from './auth-context';

export function OnboardingPage() {
  const { session } = useAuth();

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>ChessTrainer</h1>
        <p>Bienvenue {session?.user.email ?? 'joueur'}. Onboarding authentifié prêt.</p>
      </header>

      <div className="grid">
        <Board />
        <Puzzle />
        <ExplanationPanel />
        <ProgressSummary />
      </div>
    </main>
  );
}
