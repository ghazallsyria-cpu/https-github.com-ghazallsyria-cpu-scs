
import { createClient } from '@supabase/supabase-js';

// دالة لجلب متغيرات البيئة بأمان من أي نظام تشغيل
const getEnv = (name: string): string => {
  try {
    // محاولة الجلب من Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name]) {
      return (import.meta as any).env[name];
    }
    // محاولة الجلب من Node/Process
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name] as string;
    }
  } catch (e) {}
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('تنبيه: بيانات Supabase غير مكتملة في متغيرات البيئة.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
