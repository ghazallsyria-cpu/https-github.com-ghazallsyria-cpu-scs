
import { createClient } from '@supabase/supabase-js';

/**
 * دالة مساعدة للوصول الآمن لمتغيرات البيئة
 * تحاول القراءة من Vite (import.meta.env) أو من البيئة العالمية (process.env)
 * وتتجنب الأخطاء في حال كان الكائن غير معرف
 */
const safeGetEnv = (key: string): string => {
  try {
    // محاولة الوصول لمتغيرات Vite
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
    
    // محاولة الوصول لمتغيرات Node/Process (لبيئات البناء أو الاختبار)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // في حال حدوث خطأ في الوصول للميتا
  }
  return '';
};

const SUPABASE_URL = safeGetEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = safeGetEnv('VITE_SUPABASE_ANON_KEY');

// عرض تحذير في وحدة التحكم إذا كانت البيانات مفقودة
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'تنبيه: بيانات Supabase غير مكتملة. تأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في متغيرات البيئة.'
  );
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);
