
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Check various common env locations
    const env = (import.meta as any).env || (window as any).process?.env || {};
    return env[key] || '';
  } catch (e) {
    return '';
  }
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Use placeholders only if real values are missing to prevent initialization crash
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);
