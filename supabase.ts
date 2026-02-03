import { createClient } from '@supabase/supabase-js';

// جلب القيم من بيئة Vite
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('تنبيه: متغيرات Supabase غير معرفة. يرجى التأكد من إضافتها في إعدادات Netlify.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
