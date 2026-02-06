import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // @ts-ignore
  const env = import.meta.env || {};
  // @ts-ignore
  const processEnv = (typeof process !== 'undefined' ? process.env : {}) || {};
  // @ts-ignore
  const windowEnv = (window as any)._env_ || {};
  return env[key] || processEnv[key] || windowEnv[key] || '';
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(
  SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY || 'your-anon-key'
);