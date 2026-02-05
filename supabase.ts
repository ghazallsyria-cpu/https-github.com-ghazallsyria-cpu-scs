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

// سيتم استخدام قيم وهمية فقط إذا كانت متغيرات البيئة مفقودة لمنع تعطل التهيئة.
// سيتم التحقق من صحة هذه المتغيرات في ملف App.tsx.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);