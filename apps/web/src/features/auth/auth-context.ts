import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
