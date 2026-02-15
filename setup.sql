
-- 1. إيقاف وحذف جميع السياسات القديمة لتجنب التعارض
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "students_access_policy" ON public.students;
DROP POLICY IF EXISTS "lessons_access_policy" ON public.lessons;
DROP POLICY IF EXISTS "payments_access_policy" ON public.payments;
DROP POLICY IF EXISTS "schedules_access_policy" ON public.schedules;
DROP POLICY IF EXISTS "requests_select_all" ON public.tutor_requests;

-- 2. الحل الجذري لمشكلة Infinite Recursion
-- إنشاء دالة تعمل بصلاحيات المنشئ (SECURITY DEFINER) مما يسمح لها بتجاوز RLS عند التحقق من الرتبة
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- هذا السطر هو الحل السحري لتجاوز التكرار
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3. سياسات جدول Profiles
-- القراءة متاحة للجميع لتجنب المشاكل في القوائم
CREATE POLICY "profiles_read_public" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- التعديل لصاحب الحساب أو المدير (باستخدام الدالة الآمنة)
CREATE POLICY "profiles_update_secure" ON public.profiles
FOR UPDATE TO authenticated
USING ( id = auth.uid() OR public.check_is_admin() );

-- الإضافة (للتسجيل)
CREATE POLICY "profiles_insert_secure" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK ( id = auth.uid() OR public.check_is_admin() );

-- الحذف للمدير فقط
CREATE POLICY "profiles_delete_secure" ON public.profiles
FOR DELETE TO authenticated
USING ( public.check_is_admin() );

-- 4. سياسات جدول Students (الطلاب)
CREATE POLICY "students_policy_secure" ON public.students
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.check_is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.check_is_admin() );

-- 5. سياسات جدول Lessons (الحصص)
CREATE POLICY "lessons_policy_secure" ON public.lessons
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.check_is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.check_is_admin() );

-- 6. سياسات جدول Payments (المالية)
CREATE POLICY "payments_policy_secure" ON public.payments
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.check_is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.check_is_admin() );

-- 7. سياسات جدول Schedules (الجدول)
CREATE POLICY "schedules_policy_secure" ON public.schedules
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.check_is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.check_is_admin() );

-- 8. سياسات جدول Tutor Requests (الطلبات)
CREATE POLICY "requests_policy_secure" ON public.tutor_requests
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 9. التأكد من تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 10. إعادة بناء الـ View
DROP VIEW IF EXISTS public.student_summary_view;
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
