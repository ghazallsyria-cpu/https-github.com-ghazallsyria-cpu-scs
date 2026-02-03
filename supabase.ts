
import { createClient } from '@supabase/supabase-js';

// Declare process to satisfy TypeScript compiler
declare const process: any;

/**
 * دالة متقدمة لجلب متغيرات البيئة من كافة المصادر الممكنة
 * (Vite, process.env, window.env)
 */
const getEnv = (name: string): string => {
  try {
    // 1. Vite (import.meta.env)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[name];
      if (val) return val;
    }
    
    // 2. Node/Generic (process.env)
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[name];
      if (val) return val;
      
      // Try without VITE_ prefix
      const fallback = name.replace('VITE_', '');
      const val2 = process.env[fallback];
      if (val2) return val2;
    }

    // 3. Window Global (sometimes used in hosted environments)
    if (typeof window !== 'undefined' && (window as any)._env_) {
      const val = (window as any)._env_[name];
      if (val) return val;
    }
  } catch (e) {
    console.warn(`Warning: Could not access environment variable ${name}`);
  }
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// التحقق وإصدار تحذير واضح بدلاً من انهيار التطبيق
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'خطأ حرج: بيانات الاتصال بـ Supabase غير موجودة.\n' +
    'يرجى التأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في إعدادات البيئة (Environment Variables).'
  );
}

// إنشاء العميل مع استخدام قيم احتياطية لمنع "Uncaught Error: supabaseUrl is required"
// هذا يسمح للتطبيق بالتحميل وإظهار واجهة المستخدم حتى لو كان الاتصال سيفشل لاحقاً
export const supabase = createClient(
  SUPABASE_URL || 'https://missing-url.supabase.co',
  SUPABASE_ANON_KEY || 'missing-key'
);
