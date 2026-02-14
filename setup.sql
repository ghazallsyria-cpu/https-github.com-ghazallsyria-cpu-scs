
-- 1. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'student',
    is_approved BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    subjects TEXT,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT,
    group_name TEXT,
    address TEXT,
    academic_year TEXT,
    semester TEXT,
    agreed_amount NUMERIC DEFAULT 0,
    price_per_hour NUMERIC DEFAULT 0,
    is_hourly BOOLEAN DEFAULT false,
    phones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. تحسين الـ View المالي ليكون أسرع وأكثر دقة
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE student_id = s.id) as total_paid,
    (SELECT COUNT(*) FROM public.lessons WHERE student_id = s.id) as total_lessons,
    (s.agreed_amount - (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE student_id = s.id)) as remaining_balance
FROM public.students s;

-- 3. سياسات RLS المحسنة (تعتمد على JWT لسرعة الأداء)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global Profiles Access" ON public.profiles;
CREATE POLICY "Global Profiles Access" ON public.profiles FOR ALL TO authenticated 
USING (id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> role) = 'admin');

DROP POLICY IF EXISTS "Teacher Students Policy" ON public.students;
CREATE POLICY "Teacher Students Policy" ON public.students FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> role) = 'admin');

-- 4. منح الصلاحيات
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
