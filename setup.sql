
-- 1. تنظيف شامل (حذف السياسات والدوال القديمة)
DROP VIEW IF EXISTS public.student_summary_view;
DROP POLICY IF EXISTS "profiles_read_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_secure" ON public.profiles;
DROP POLICY IF EXISTS "students_policy_secure" ON public.students;
DROP POLICY IF EXISTS "lessons_policy_secure" ON public.lessons;
DROP POLICY IF EXISTS "payments_policy_secure" ON public.payments;
DROP POLICY IF EXISTS "schedules_policy_secure" ON public.schedules;
DROP POLICY IF EXISTS "requests_policy_secure" ON public.tutor_requests;

DROP FUNCTION IF EXISTS public.check_is_admin();

-- 2. دالة التحقق من المدير (الحل الجذري للتكرار)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3. تحديث هيكلية الجداول (لضمان وجود الأعمدة المطلوبة)
-- التأكد من أن students.phones هو JSONB
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones') THEN
        ALTER TABLE public.students ADD COLUMN phones JSONB DEFAULT '[]'::jsonb;
    ELSE
        -- محاولة تحويل العمود إذا كان موجوداً بنوع آخر (اختياري، يفضل الحذر هنا)
        -- ALTER TABLE public.students ALTER COLUMN phones TYPE JSONB USING phones::jsonb;
        NULL;
    END IF;
END $$;

-- 4. سياسات الأمان (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self_or_admin" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.check_is_admin());

-- Students (المعلم يرى طلابه، المدير يرى الجميع)
CREATE POLICY "students_access" ON public.students FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- Lessons
CREATE POLICY "lessons_access" ON public.lessons FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- Payments
CREATE POLICY "payments_access" ON public.payments FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- Schedules
CREATE POLICY "schedules_access" ON public.schedules FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- Requests (مفتوح للجميع لإنشاء الطلبات، الإدارة للمدير)
CREATE POLICY "requests_access" ON public.tutor_requests FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 5. إعادة بناء الـ View المالي الشامل
CREATE VIEW public.student_summary_view AS
SELECT 
    s.id,
    s.teacher_id,
    s.name,
    s.grade,
    s.group_name,
    s.agreed_amount,
    s.academic_year,
    s.semester,
    s.phones,
    s.created_at,
    COALESCE(SUM(p.amount), 0) as total_paid,
    COALESCE(COUNT(DISTINCT l.id), 0) as total_lessons,
    (s.agreed_amount - COALESCE(SUM(p.amount), 0)) as remaining_balance
FROM public.students s
LEFT JOIN public.payments p ON s.id = p.student_id
LEFT JOIN public.lessons l ON s.id = l.student_id
GROUP BY s.id;

GRANT SELECT ON public.student_summary_view TO authenticated;
