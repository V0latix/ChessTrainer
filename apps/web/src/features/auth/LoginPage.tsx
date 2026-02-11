import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { supabase } from '../../lib/supabase';

type LoginPageProps = {
  onLoggedIn?: () => void;
};

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const navigate = useNavigate();
  const { isConfigured, isLoading, session } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <p className="auth-message">Chargement de la session...</p>;
  }

  if (session) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleSuccess = () => {
    if (onLoggedIn) {
      onLoggedIn();
      return;
    }

    navigate('/onboarding');
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!supabase || !isConfigured) {
      setErrorMessage('Configuration Supabase manquante. Ajoute les variables VITE_SUPABASE_* .');
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data.session) {
      setErrorMessage('Session invalide. Réessaie.');
      return;
    }

    handleSuccess();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Connexion ChessTrainer</h1>
        <p className="auth-subtitle">Connecte-toi pour continuer ton entraînement.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="auth-input"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="auth-label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            className="auth-input"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch">
          Pas encore inscrit ? <Link to="/register">Créer un compte</Link>
        </p>

        {errorMessage ? <p className="auth-message auth-message-error">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
