
-- 1. تنظيف السياسات القديمة والمسببة للمشاكل لمنع التكرار (Recursion)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin see all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "admin_select" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_all" ON public.profiles;
DROP POLICY IF EXISTS "select_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_profile" ON public.profiles;

-- 2. إنشاء دالة مساعدة مع خاصية SECURITY DEFINER لتجنب الـ Recursion
-- هذه الدالة تتأكد من رتبة المستخدم بدون استدعاء السياسات مرة أخرى
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_approved()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql;

-- 3. تفعيل الحماية (RLS) لجميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. سياسات البروفايلات (Profiles)
CREATE POLICY "profile_select" ON public.profiles FOR SELECT 
USING (auth.uid() = id OR check_is_admin());

CREATE POLICY "profile_insert" ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_update" ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR check_is_admin());

-- 5. سياسات الطلاب (Students)
DROP POLICY IF EXISTS "insert_student" ON public.students;
CREATE POLICY "insert_student" ON public.students FOR INSERT 
WITH CHECK (auth.uid() = teacher_id AND check_is_approved());

DROP POLICY IF EXISTS "select_student" ON public.students;
CREATE POLICY "select_student" ON public.students FOR SELECT 
USING (auth.uid() = teacher_id OR check_is_admin());

DROP POLICY IF EXISTS "delete_student" ON public.students;
CREATE POLICY "delete_student" ON public.students FOR DELETE 
USING (auth.uid() = teacher_id OR check_is_admin());

-- 6. سياسات الدروس (Lessons)
DROP POLICY IF EXISTS "insert_lesson" ON public.lessons;
CREATE POLICY "insert_lesson" ON public.lessons FOR INSERT 
WITH CHECK (auth.uid() = teacher_id AND check_is_approved());

DROP POLICY IF EXISTS "select_lesson" ON public.lessons;
CREATE POLICY "select_lesson" ON public.lessons FOR SELECT 
USING (auth.uid() = teacher_id OR check_is_admin());

-- 7. سياسات المدفوعات (Payments)
DROP POLICY IF EXISTS "insert_payment" ON public.payments;
CREATE POLICY "insert_payment" ON public.payments FOR INSERT 
WITH CHECK (auth.uid() = teacher_id AND check_is_approved());

DROP POLICY IF EXISTS "select_payment" ON public.payments;
CREATE POLICY "select_payment" ON public.payments FOR SELECT 
USING (auth.uid() = teacher_id OR check_is_admin());

-- 8. تثبيت حساب المدير العام
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
