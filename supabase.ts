
import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[name] || '';
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name] || '';
    }
  } catch (e) {}
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Check Environment Variables.');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);
