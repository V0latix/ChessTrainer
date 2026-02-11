const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT;
const sentryRelease = import.meta.env.VITE_SENTRY_RELEASE;

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  apiBaseUrl,
  sentryDsn,
  sentryEnvironment,
  sentryRelease,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};
