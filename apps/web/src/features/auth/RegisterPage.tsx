import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { supabase } from '../../lib/supabase';

type RegisterPageProps = {
  onRegistered?: () => void;
};

export function RegisterPage({ onRegistered }: RegisterPageProps) {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = () => {
    if (onRegistered) {
      onRegistered();
      return;
    }

    navigate('/onboarding');
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isAgeConfirmed) {
      setErrorMessage('Tu dois confirmer que tu as au moins 16 ans pour créer un compte.');
      return;
    }

    if (!supabase || !isConfigured) {
      setErrorMessage('Configuration Supabase manquante. Ajoute les variables VITE_SUPABASE_* .');
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          age_confirmed: true,
          age_confirmed_at: new Date().toISOString(),
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      handleSuccess();
      return;
    }

    setSuccessMessage('Compte créé. Vérifie ton email pour activer la session.');
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Créer un compte ChessTrainer</h1>
        <p className="auth-subtitle">Inscris-toi pour analyser tes parties et corriger tes erreurs.</p>

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={isAgeConfirmed}
              onChange={(event) => setIsAgeConfirmed(event.target.checked)}
            />
            <span>Je confirme avoir au moins 16 ans.</span>
          </label>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        {errorMessage ? <p className="auth-message auth-message-error">{errorMessage}</p> : null}
        {successMessage ? <p className="auth-message auth-message-success">{successMessage}</p> : null}
      </section>
    </main>
  );
}
