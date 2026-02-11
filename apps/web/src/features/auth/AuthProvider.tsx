import { useEffect, useMemo, useState } from 'react';
import { env } from '../../config/env';
import { syncIdentityWithApi } from '../../lib/auth-sync';
import { supabase } from '../../lib/supabase';
import { AuthContext } from './auth-context';
import type { Session } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => {
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    void syncIdentityWithApi(session.access_token).catch((error) => {
      console.error('[auth-sync] identity sync failed', error);
    });
  }, [session?.access_token]);

  const value = useMemo(
    () => ({ session, isLoading, isConfigured: env.isSupabaseConfigured }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
