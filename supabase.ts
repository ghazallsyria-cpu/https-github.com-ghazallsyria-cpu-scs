
import { createClient } from '@supabase/supabase-js';

const safeGetEnv = (key: string): string => {
  // محاولة الجلب من import.meta.env (Vite)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}

  // محاولة الجلب من process.env (Node/Classic)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return '';
};

const SUPABASE_URL = safeGetEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = safeGetEnv('VITE_SUPABASE_ANON_KEY');

// قيم افتراضية لمنع توقف التطبيق أثناء التطوير
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);
