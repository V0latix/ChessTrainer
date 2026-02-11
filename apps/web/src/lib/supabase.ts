import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export const supabase = env.isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null;
