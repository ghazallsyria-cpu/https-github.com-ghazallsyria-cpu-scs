
import { createClient } from '@supabase/supabase-js';

// Declare process to satisfy TypeScript compiler during build
declare const process: any;

/**
 * دالة محسنة لجلب متغيرات البيئة من مصادر مختلفة (Vite, Netlify, process.env)
 */
const getEnv = (name: string): string => {
  try {
    // 1. Vite Environment
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteVal = (import.meta as any).env[name];
      if (viteVal) return viteVal;
    }
    // 2. Global process.env
    if (typeof process !== 'undefined' && process.env) {
      const procVal = process.env[name];
      if (procVal) return procVal;
      
      // Try without VITE_ prefix if it was passed that way
      const fallbackName = name.replace('VITE_', '');
      const fallbackVal = process.env[fallbackName];
      if (fallbackVal) return fallbackVal;
    }
  } catch (e) {
    console.error(`Error accessing env var ${name}:`, e);
  }
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// التحقق من وجود القيم قبل المحاولة لتجنب Uncaught Error: supabaseUrl is required
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('خطأ: بيانات Supabase غير متوفرة. يرجى التأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.');
}

// تصدير العميل مع معالجة حالة القيم الفارغة لتجنب انهيار التطبيق
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
