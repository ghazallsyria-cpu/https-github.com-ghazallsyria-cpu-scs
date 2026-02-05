import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const env = (import.meta as any).env || (window as any).process?.env || {};
    return env[key] || '';
  } catch (e) {
    return '';
  }
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);