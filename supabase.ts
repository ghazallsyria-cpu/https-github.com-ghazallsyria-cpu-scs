import { createClient } from '@supabase/supabase-js';

// Declare process to satisfy TypeScript compiler during build
declare const process: any;

const getEnv = (name: string): string => {
  try {
    // 1. Try Vite's import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name]) {
      return (import.meta as any).env[name];
    }
    // 2. Try global process.env (for Netlify/Build environments)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name] as string;
    }
  } catch (e) {
    // Fallback if environment access is restricted
  }
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('تنبيه: بيانات Supabase غير مكتملة في متغيرات البيئة.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');