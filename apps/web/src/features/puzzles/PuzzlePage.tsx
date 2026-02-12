import { Link } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout/AppLayout';
import { PuzzleTrainer } from './PuzzleTrainer';

export function PuzzlePage() {
  return (
    <AppLayout>
      <main className="app-shell">
        <header className="hero">
          <h1>Session de puzzles</h1>
          <p>Rejoue une séquence de positions critiques issues de tes parties.</p>
          <p>
            <Link to="/onboarding">Retour à l’onboarding</Link>
          </p>
          <p>
            <Link to="/progress">Voir mon résumé de progression</Link>
          </p>
        </header>
        <PuzzleTrainer />
      </main>
    </AppLayout>
  );
}
