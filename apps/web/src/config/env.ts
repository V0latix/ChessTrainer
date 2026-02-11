const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  apiBaseUrl,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};
