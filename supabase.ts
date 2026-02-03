
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jsarrprbeyhdmieuogxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYXJycHJiZXloZG1pZXVvZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTk1NDAsImV4cCI6MjA4NTY3NTU0MH0.lEg8gtJLY0yeYMf-XOfKRLsGMNWbZiBwy3Fy_rWXA58';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYXJycHJiZXloZG1pZXVvZ3hsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA5OTU0MCwiZXhwIjoyMDg1Njc1NTQwfQ.2cOsGcOXnG3lQ38WKYXkz4bqf5NXJsUL4etX0IO1WHM';

// العميل العادي للجلسات
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// عميل الأدمن (يستخدم فقط في صفحة المدير لإنشاء الحسابات)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
