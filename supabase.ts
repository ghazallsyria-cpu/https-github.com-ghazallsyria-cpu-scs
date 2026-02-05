
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // البحث في متغيرات البيئة بشتى الطرق الممكنة في المتصفح
  const env = (window as any).process?.env || (import.meta as any).env || {};
  return env[key] || '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);
