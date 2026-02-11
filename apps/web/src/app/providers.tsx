import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}
