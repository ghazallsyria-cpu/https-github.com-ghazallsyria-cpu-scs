import { createClient } from '@supabase/supabase-js';

// دالة محسنة لجلب المتغيرات من أي بيئة (Vite, Process, or Window)
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

// تسجيل حالة الاتصال في وحدة التحكم (بدون كشف المفاتيح) للتشخيص
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("⚠️ تحذير: مفاتيح Supabase مفقودة. تأكد من إضافتها في إعدادات Netlify.");
} else {
  console.log("✅ تم تهيئة اتصال Supabase بنجاح.");
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);