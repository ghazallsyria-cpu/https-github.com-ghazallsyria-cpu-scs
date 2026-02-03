
-- ==========================================
-- 1. تنظيف شامل للسياسات والوظائف القديمة
-- ==========================================
DROP POLICY IF EXISTS "p_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "p_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "p_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "s_insert_policy" ON public.students;
DROP POLICY IF EXISTS "s_select_policy" ON public.students;
DROP POLICY IF EXISTS "s_delete_policy" ON public.students;
DROP POLICY IF EXISTS "s_update_policy" ON public.students;
DROP POLICY IF EXISTS "l_insert_policy" ON public.lessons;
DROP POLICY IF EXISTS "l_select_policy" ON public.lessons;
DROP POLICY IF EXISTS "pay_insert_policy" ON public.payments;
DROP POLICY IF EXISTS "pay_select_policy" ON public.payments;

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_approved();

-- ==========================================
-- 2. إنشاء وظائف Security Definer معزولة
-- هذه الوظائف تتجاوز الـ RLS لأنها تعمل بصلاحية المالك (postgres)
-- ==========================================

-- التحقق هل المستخدم مدير
CREATE OR REPLACE FUNCTION public.check_if_admin(u_id uuid) 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = u_id AND role = 'admin'
  );
END;
$$;

-- التحقق هل المستخدم مفعل
CREATE OR REPLACE FUNCTION public.check_if_approved(u_id uuid) 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = u_id AND is_approved = true
  );
END;
$$;

-- ==========================================
-- 3. تفعيل RLS على الجداول
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. سياسات البروفايلات (Profiles) - تجنب Recursion
-- الحل: المستخدم يرى نفسه دائماً، والمدير يرى الجميع عبر الوظيفة المعزولة
-- ==========================================

-- سياسة الاختيار: المستخدم يرى نفسه، أو إذا كان مديراً (باستخدام الوظيفة المعزولة)
CREATE POLICY "profiles_select_v2" ON public.profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  public.check_if_admin(auth.uid())
);

CREATE POLICY "profiles_insert_v2" ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_v2" ON public.profiles FOR UPDATE 
USING (
  auth.uid() = id 
  OR 
  public.check_if_admin(auth.uid())
);

-- ==========================================
-- 5. سياسات الطلاب (Students)
-- ==========================================
CREATE POLICY "students_insert_v2" ON public.students FOR INSERT 
WITH CHECK (
  auth.uid() = teacher_id 
  AND 
  public.check_if_approved(auth.uid())
);

CREATE POLICY "students_select_v2" ON public.students FOR SELECT 
USING (
  auth.uid() = teacher_id 
  OR 
  public.check_if_admin(auth.uid())
);

CREATE POLICY "students_delete_v2" ON public.students FOR DELETE 
USING (
  auth.uid() = teacher_id 
  OR 
  public.check_if_admin(auth.uid())
);

-- ==========================================
-- 6. سياسات الدروس والمالية
-- ==========================================
CREATE POLICY "lessons_insert_v2" ON public.lessons FOR INSERT 
WITH CHECK (
  auth.uid() = teacher_id 
  AND 
  public.check_if_approved(auth.uid())
);

CREATE POLICY "lessons_select_v2" ON public.lessons FOR SELECT 
USING (
  auth.uid() = teacher_id 
  OR 
  public.check_if_admin(auth.uid())
);

CREATE POLICY "payments_insert_v2" ON public.payments FOR INSERT 
WITH CHECK (
  auth.uid() = teacher_id 
  AND 
  public.check_if_approved(auth.uid())
);

CREATE POLICY "payments_select_v2" ON public.payments FOR SELECT 
USING (
  auth.uid() = teacher_id 
  OR 
  public.check_if_admin(auth.uid())
);

-- ==========================================
-- 7. تحديث المدير العام
-- ==========================================
-- ملاحظة: تأكد من تشغيل هذا الكود بعد إنشاء حسابك الأول لتمتلك صلاحيات الإدارة
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
