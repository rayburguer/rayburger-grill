import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL or Anon Key missing. Data sync will be disabled.');
}

// Safe initialization: Only create client if keys exist to prevent white-screen crashes
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
