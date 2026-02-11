import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <p className="auth-message">Chargement de la session...</p>;
  }

  if (!session) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
}
