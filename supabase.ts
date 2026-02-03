
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jsarrprbeyhdmieuogxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYXJycHJiZXloZG1pZXVvZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTk1NDAsImV4cCI6MjA4NTY3NTU0MH0.lEg8gtJLY0yeYMf-XOfKRLsGMNWbZiBwy3Fy_rWXA58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
