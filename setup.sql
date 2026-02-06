
-- 1. التأكد من وجود عمود المواد الدراسية في جدول الحسابات
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subjects') THEN
        ALTER TABLE public.profiles ADD COLUMN subjects text;
    END IF;
END $$;

-- 2. تحديث جدول الطلاب للتأكد من دعم الربط المتعدد
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones') THEN
        ALTER TABLE public.students ADD COLUMN phones jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. إعادة بناء العرض التفاعلي (View) بعد التأكد من الأعمدة
DROP VIEW IF EXISTS public.student_summary_view;
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

-- 4. تحديث وظيفة بوابة ولي الأمر
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

-- 5. تفعيل سياسات الأمان الصارمة (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- سياسة المعلم (إدارة ذاتية)
DROP POLICY IF EXISTS "Teachers can manage their own data" ON public.students;
CREATE POLICY "Teachers can manage their own data" ON public.students 
FOR ALL USING (teacher_id = auth.uid());

-- سياسة المدير (رؤية كل شيء)
CREATE POLICY "Admins can do everything" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
