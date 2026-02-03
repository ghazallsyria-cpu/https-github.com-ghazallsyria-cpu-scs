import { createClient } from '@supabase/supabase-js';

// استخدام حماية إضافية للوصول إلى متغيرات البيئة
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase Environment Variables! Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Netlify Environment Variables.');
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);
