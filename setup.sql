
-- 1. تنظيف شامل للسياسات والدوال القديمة (Hard Reset for Permissions)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

DROP POLICY IF EXISTS "lessons_select" ON public.lessons;
DROP POLICY IF EXISTS "lessons_insert" ON public.lessons;
DROP POLICY IF EXISTS "lessons_update" ON public.lessons;
DROP POLICY IF EXISTS "lessons_delete" ON public.lessons;

DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_update" ON public.payments;
DROP POLICY IF EXISTS "payments_delete" ON public.payments;

DROP POLICY IF EXISTS "schedules_all" ON public.schedules;
DROP POLICY IF EXISTS "requests_insert_public" ON public.tutor_requests;
DROP POLICY IF EXISTS "requests_select_involved" ON public.tutor_requests;
DROP POLICY IF EXISTS "requests_update_involved" ON public.tutor_requests;

-- حذف الدوال القديمة لتجنب التعارض
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;
DROP VIEW IF EXISTS public.student_summary_view;

-- 2. الحل الهندسي لمشكلة التكرار (SECURITY DEFINER)
-- هذه الدالة تعمل بصلاحيات منشئ قاعدة البيانات، فتتجاوز سياسات RLS عند التحقق من الرتبة
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- التحقق المباشر بدون تفعيل سياسات الجدول على هذا الاستعلام
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3. ضمان صحة أنواع البيانات (Data Integrity)
DO $$
BEGIN
    -- تحويل phones إلى JSONB إذا كان نصاً، أو إضافته
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones' AND data_type='text') THEN
        ALTER TABLE public.students ALTER COLUMN phones TYPE JSONB USING phones::jsonb;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones') THEN
        ALTER TABLE public.students ADD COLUMN phones JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- إضافة teacher_id للطلبات إذا لم يوجد
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutor_requests' AND column_name='teacher_id') THEN
        ALTER TABLE public.tutor_requests ADD COLUMN teacher_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. إعادة تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 5. صياغة السياسات (Policies) بناءً على الرتب

-- >> PROFILES
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.check_is_admin());

-- >> STUDENTS (المعلم يرى طلابه فقط، المدير يرى الجميع)
CREATE POLICY "students_all_access" ON public.students FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- >> LESSONS
CREATE POLICY "lessons_all_access" ON public.lessons FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- >> PAYMENTS
CREATE POLICY "payments_all_access" ON public.payments FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- >> SCHEDULES
CREATE POLICY "schedules_all_access" ON public.schedules FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR public.check_is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());

-- >> TUTOR REQUESTS
CREATE POLICY "requests_insert" ON public.tutor_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "requests_select" ON public.tutor_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "requests_update" ON public.tutor_requests FOR UPDATE TO authenticated USING (public.check_is_admin() OR teacher_id = auth.uid());

-- 6. إنشاء الـ View المجمع (لأداء أسرع في التقارير)
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

-- منح الصلاحيات
GRANT SELECT ON public.student_summary_view TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
