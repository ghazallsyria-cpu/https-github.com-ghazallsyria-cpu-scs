
-- 1. تنظيف وإعادة تأسيس (Reset)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.check_is_admin();

-- 2. دالة التحقق من المدير (الحل لمشكلة التكرار)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق المباشر بدون الاعتماد على سياسات أخرى
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 3. (هام جداً) دالة ومشغل لنسخ المستخدمين الجدد من Auth إلى Public Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, is_approved, subjects)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE 
        WHEN (new.raw_user_meta_data->>'role') = 'teacher' THEN false -- المعلم يحتاج موافقة
        ELSE true -- الطالب وولي الأمر تفعيل تلقائي
    END,
    COALESCE(new.raw_user_meta_data->>'subjects', '')
  );
  RETURN new;
END;
$$;

-- تفعيل المشغل
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. إصلاح وتوسيع سياسات الأمان (RLS)

-- تفعيل الأمان على الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- >> سياسات Profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_admin" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self_admin" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.check_is_admin());

-- >> سياسات Students
DROP POLICY IF EXISTS "students_policy" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());

-- >> سياسات Lessons (حل مشكلة إضافة الحصص)
DROP POLICY IF EXISTS "lessons_policy" ON public.lessons;
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());
-- السماح بالإضافة إذا كان المستخدم هو المعلم نفسه
CREATE POLICY "lessons_insert" ON public.lessons FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin()); 
CREATE POLICY "lessons_update" ON public.lessons FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "lessons_delete" ON public.lessons FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());

-- >> سياسات Payments (حل مشكلة إضافة الدفعات)
DROP POLICY IF EXISTS "payments_policy" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());
CREATE POLICY "payments_delete" ON public.payments FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());

-- >> سياسات Schedules
DROP POLICY IF EXISTS "schedules_policy" ON public.schedules;
CREATE POLICY "schedules_all" ON public.schedules FOR ALL TO authenticated USING (teacher_id = auth.uid() OR public.check_is_admin());

-- >> سياسات Tutor Requests (حل مشكلة طلبات أولياء الأمور)
DROP POLICY IF EXISTS "requests_policy" ON public.tutor_requests;
-- السماح للجميع (المصادق عليهم) بإنشاء طلبات
CREATE POLICY "requests_insert_public" ON public.tutor_requests FOR INSERT TO authenticated WITH CHECK (true);
-- السماح لصاحب الطلب أو المعلم أو المدير برؤية الطلب
CREATE POLICY "requests_select_involved" ON public.tutor_requests FOR SELECT TO authenticated 
USING (student_phone = (select phone from profiles where id = auth.uid()) OR teacher_id = auth.uid() OR public.check_is_admin());
-- السماح للمدير فقط بالتعديل (التعيين)
CREATE POLICY "requests_update_admin" ON public.tutor_requests FOR UPDATE TO authenticated USING (public.check_is_admin());

-- 5. إعادة بناء الـ View المالي
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
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
