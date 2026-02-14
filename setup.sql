
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

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    student_id UUID REFERENCES public.students ON DELETE CASCADE,
    lesson_date DATE DEFAULT CURRENT_DATE,
    hours NUMERIC DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    student_id UUID REFERENCES public.students ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'كاش',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    student_id UUID REFERENCES public.students ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tutor_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    grade TEXT,
    subject TEXT,
    modality TEXT DEFAULT 'home',
    status TEXT DEFAULT 'pending',
    teacher_id UUID REFERENCES auth.users ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. تحسين الـ View المالي (حذف ثم إنشاء لتجنب الخطأ 42P16)
DROP VIEW IF EXISTS public.student_summary_view CASCADE;
CREATE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id), 0) as total_paid,
    COALESCE((SELECT COUNT(*) FROM public.lessons WHERE student_id = s.id), 0) as total_lessons,
    (s.agreed_amount - COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id), 0)) as remaining_balance
FROM public.students s;

-- 3. وظيفة بوابة أولياء الأمور (RPC) - حذف أولاً لتجنب الخطأ 42P13
DROP FUNCTION IF EXISTS public.get_parent_dashboard(TEXT);
CREATE OR REPLACE FUNCTION public.get_parent_dashboard(parent_phone_val TEXT)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    teacher_name TEXT,
    teacher_subjects TEXT,
    total_lessons BIGINT,
    total_paid NUMERIC,
    remaining_balance NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as student_id,
        s.name as student_name,
        p.full_name as teacher_name,
        p.subjects as teacher_subjects,
        (SELECT COUNT(*) FROM public.lessons WHERE student_id = s.id) as total_lessons,
        COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id), 0) as total_paid,
        (s.agreed_amount - COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id), 0)) as remaining_balance
    FROM public.students s
    JOIN public.profiles p ON s.teacher_id = p.id
    WHERE s.phones @> jsonb_build_array(jsonb_build_object('number', parent_phone_val))
       OR s.phones @> jsonb_build_array(jsonb_build_object('number', parent_phone_val, 'label', 'ولي الأمر'))
       OR s.phones @> jsonb_build_array(jsonb_build_object('number', parent_phone_val, 'label', 'الطالب'));
END;
$$;

-- 4. سياسات RLS المحسنة
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles Access Policy" ON public.profiles;
CREATE POLICY "Profiles Access Policy" ON public.profiles FOR ALL TO authenticated 
USING (id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Students Access Policy" ON public.students;
CREATE POLICY "Students Access Policy" ON public.students FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Lessons Access Policy" ON public.lessons;
CREATE POLICY "Lessons Access Policy" ON public.lessons FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Payments Access Policy" ON public.payments;
CREATE POLICY "Payments Access Policy" ON public.payments FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Schedules Access Policy" ON public.schedules;
CREATE POLICY "Schedules Access Policy" ON public.schedules FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Requests Global Policy" ON public.tutor_requests;
CREATE POLICY "Requests Global Policy" ON public.tutor_requests FOR ALL TO authenticated 
USING (true);

-- 5. منح الصلاحيات
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_dashboard(TEXT) TO authenticated;
