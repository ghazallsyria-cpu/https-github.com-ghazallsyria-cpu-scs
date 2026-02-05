
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // Safe access to environment variables in both Vite and general browser contexts
  try {
    const env = (import.meta as any).env || (window as any).process?.env || {};
    return env[key] || '';
  } catch (e) {
    return '';
  }
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);
