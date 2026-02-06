
-- 1. جداول النظام الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name text,
    phone text UNIQUE,
    role text CHECK (role IN ('admin', 'teacher', 'parent')),
    subjects text, -- المواد التي يدرسها المعلم
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    grade text,
    address text,
    phones jsonb DEFAULT '[]'::jsonb, -- [{number: '...', label: '...'}]
    academic_year text,
    semester text,
    agreed_amount numeric DEFAULT 0,
    is_hourly boolean DEFAULT false,
    price_per_hour numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_date date DEFAULT CURRENT_DATE,
    hours numeric DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    amount numeric DEFAULT 0,
    payment_date date DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    day_of_week text NOT NULL,
    start_time time NOT NULL,
    duration_hours numeric DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. تفعيل سياسات الأمان (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- سياسات المعلم: يرى فقط بياناته
CREATE POLICY "Teachers can manage their own data" ON public.students 
FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage their lessons" ON public.lessons 
FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage their payments" ON public.payments 
FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage their schedules" ON public.schedules 
FOR ALL USING (teacher_id = auth.uid());

-- سياسة ولي الأمر: يرى الطلاب المرتبطين برقم هاتفه
CREATE POLICY "Parents view their students" ON public.students 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = 'parent' 
        AND students.phones @> jsonb_build_array(jsonb_build_object('number', p.phone))
    )
);

-- 3. العروض التفاعلية (Views) للإحصائيات
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    p.full_name as teacher_name,
    p.subjects as teacher_subjects,
    (SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id) as total_lessons,
    (SELECT COALESCE(SUM(l.hours), 0) FROM public.lessons l WHERE l.student_id = s.id) as total_hours,
    (SELECT COALESCE(SUM(pay.amount), 0) FROM public.payments pay WHERE pay.student_id = s.id) as total_paid,
    (CASE 
        WHEN s.is_hourly THEN (SELECT COALESCE(SUM(l.hours), 0) * s.price_per_hour FROM public.lessons l WHERE l.student_id = s.id)
        ELSE s.agreed_amount 
    END) - (SELECT COALESCE(SUM(pay.amount), 0) FROM public.payments pay WHERE pay.student_id = s.id) as remaining_balance
FROM public.students s
JOIN public.profiles p ON s.teacher_id = p.id;

-- 4. وظائف الربط التلقائي
CREATE OR REPLACE FUNCTION public.get_parent_dashboard(parent_phone_val text)
RETURNS TABLE (
    student_name text,
    teacher_name text,
    teacher_subjects text,
    total_lessons bigint,
    total_paid numeric,
    remaining_balance numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.name, v.teacher_name, v.teacher_subjects, v.total_lessons, v.total_paid, v.remaining_balance
    FROM public.student_summary_view v
    WHERE v.phones @> jsonb_build_array(jsonb_build_object('number', parent_phone_val));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
