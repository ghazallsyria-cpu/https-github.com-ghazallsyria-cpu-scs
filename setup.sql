
-- 1. التأكد من وجود العمود subjects في جدول الحسابات
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subjects') THEN
        ALTER TABLE public.profiles ADD COLUMN subjects text;
    END IF;
END $$;

-- 2. التأكد من وجود العمود phones في جدول الطلاب
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones') THEN
        ALTER TABLE public.students ADD COLUMN phones jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. إعادة بناء الـ View بشكل آمن مع استخدام LEFT JOIN لضمان ظهور البيانات حتى لو كان هناك نقص في البروفايل
DROP VIEW IF EXISTS public.student_summary_view;
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(p.full_name, 'معلم غير معروف') as teacher_name,
    COALESCE(p.subjects, 'غير محدد') as teacher_subjects,
    (SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id) as total_lessons,
    (SELECT COALESCE(SUM(l.hours), 0) FROM public.lessons l WHERE l.student_id = s.id) as total_hours,
    (SELECT COALESCE(SUM(pay.amount), 0) FROM public.payments pay WHERE pay.student_id = s.id) as total_paid,
    (CASE 
        WHEN s.is_hourly THEN (SELECT COALESCE(SUM(l.hours), 0) * s.price_per_hour FROM public.lessons l WHERE l.student_id = s.id)
        ELSE s.agreed_amount 
    END) - (SELECT COALESCE(SUM(pay.amount), 0) FROM public.payments pay WHERE pay.student_id = s.id) as remaining_balance
FROM public.students s
LEFT JOIN public.profiles p ON s.teacher_id = p.id;

-- 4. سياسات الوصول (RLS) - المدير يرى كل شيء والمعلم يرى طلابه فقط
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students Access Policy" ON public.students;
CREATE POLICY "Students Access Policy" ON public.students 
FOR ALL USING (
    teacher_id = auth.uid() 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
