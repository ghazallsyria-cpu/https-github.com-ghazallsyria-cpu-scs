import { createClient } from '@supabase/supabase-js';

/**
 * دالة مساعدة للوصول الآمن لمتغيرات البيئة في بيئة Vite
 * تم إزالة التحقق من 'process' لتجنب أخطاء TypeScript أثناء عملية البناء (Build)
 */
const safeGetEnv = (key: string): string => {
  try {
    // في Vite، يتم حقن متغيرات البيئة في import.meta.env
    // نستخدم الاختيار الاختياري (Optional Chaining) لضمان عدم توقف التطبيق
    const env = import.meta.env;
    if (env && env[key]) {
      return env[key];
    }
  } catch (e) {
    // في حال كان import.meta غير مدعوم في المتصفحات القديمة جداً
  }
  return '';
};

const SUPABASE_URL = safeGetEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = safeGetEnv('VITE_SUPABASE_ANON_KEY');

// عرض تحذير في وحدة التحكم إذا كانت البيانات مفقودة
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'تنبيه: بيانات Supabase غير مكتملة. تأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في إعدادات Netlify.'
  );
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);
