import './App.css';
import { Board } from './components/Board/Board';
import { ExplanationPanel } from './components/ExplanationPanel/ExplanationPanel';
import { ProgressSummary } from './components/ProgressSummary/ProgressSummary';
import { Puzzle } from './components/Puzzle/Puzzle';

function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <h1>ChessTrainer</h1>
        <p>Desktop-first training shell bootstrap (Story 1.1).</p>
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

export default App;
