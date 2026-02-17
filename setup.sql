
-- 1. هدم البنية القديمة بالكامل (Views, Policies, Functions)
DROP VIEW IF EXISTS public.student_summary_view;

-- إيقاف الحماية مؤقتاً لتنظيف السياسات
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests DISABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة (لتجنب التعارض)
DROP POLICY IF EXISTS "profiles_read_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "students_policy" ON public.students;
DROP POLICY IF EXISTS "lessons_policy" ON public.lessons;
DROP POLICY IF EXISTS "payments_policy" ON public.payments;
DROP POLICY IF EXISTS "schedules_policy" ON public.schedules;
DROP POLICY IF EXISTS "requests_policy_all" ON public.tutor_requests;

-- حذف الدالة المسببة للمشاكل
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;

-- 2. إنشاء دالة التحقق الآمنة (SECURITY DEFINER)
-- هذه الدالة تعمل بصلاحيات "النظام" وليس المستخدم، مما يمنع التكرار اللانهائي
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- الحل السحري
SET search_path = public -- حماية أمنية
AS $$
BEGIN
  -- التحقق المباشر بدون المرور عبر سياسات RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3. تفعيل RLS مرة أخرى
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 4. كتابة السياسات الجديدة (الآمنة)

-- >>> جدول Profiles <<<
-- السماح للجميع بالقراءة (لكسر الحلقة، لأننا نحتاج قراءة الاسم والرتبة)
CREATE POLICY "profiles_select_public" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- السماح بالإضافة (للتسجيل الجديد)
CREATE POLICY "profiles_insert_self" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- السماح بالتعديل (للشخص نفسه أو المدير باستخدام الدالة الآمنة)
CREATE POLICY "profiles_update_self_admin" ON public.profiles
FOR UPDATE TO authenticated
USING ( auth.uid() = id OR public.is_admin() );

-- السماح بالحذف (للمدير فقط)
CREATE POLICY "profiles_delete_admin" ON public.profiles
FOR DELETE TO authenticated
USING ( public.is_admin() );


-- >>> جدول Students وباقي الجداول <<<
-- المعلم يرى بياناته، والمدير يرى الكل
CREATE POLICY "students_policy" ON public.students
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.is_admin() );

CREATE POLICY "lessons_policy" ON public.lessons
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.is_admin() );

CREATE POLICY "payments_policy" ON public.payments
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.is_admin() );

CREATE POLICY "schedules_policy" ON public.schedules
FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR public.is_admin() )
WITH CHECK ( teacher_id = auth.uid() OR public.is_admin() );

CREATE POLICY "requests_policy" ON public.tutor_requests
FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- 5. إصلاح هيكلية البيانات (JSONB للهواتف)
DO $$
BEGIN
    -- التأكد من أن عمود phones من نوع JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones' AND data_type='text') THEN
        ALTER TABLE public.students ALTER COLUMN phones TYPE JSONB USING phones::jsonb;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phones') THEN
        ALTER TABLE public.students ADD COLUMN phones JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;


-- 6. إعادة بناء الـ View للتقارير
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
