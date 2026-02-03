
-- ==========================================
-- 1. تنظيف شامل للسياسات والوظائف القديمة المتسببة في التكرار
-- ==========================================
DROP POLICY IF EXISTS "profiles_select_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_v2" ON public.profiles;
DROP POLICY IF EXISTS "students_insert_v2" ON public.students;
DROP POLICY IF EXISTS "students_select_v2" ON public.students;
DROP POLICY IF EXISTS "students_delete_v2" ON public.students;
DROP POLICY IF EXISTS "lessons_insert_v2" ON public.lessons;
DROP POLICY IF EXISTS "lessons_select_v2" ON public.lessons;
DROP POLICY IF EXISTS "payments_insert_v2" ON public.payments;
DROP POLICY IF EXISTS "payments_select_v2" ON public.payments;

-- ==========================================
-- 2. وظائف SECURITY DEFINER محسنة
-- المفتاح هنا هو استخدام SECURITY DEFINER لتجاوز RLS داخل الوظيفة نفسها
-- ==========================================

-- دالة للتحقق من الإدارة بدون التسبب في تكرار
CREATE OR REPLACE FUNCTION public.is_admin_v3(u_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = u_id AND role = 'admin'
  );
$$;

-- دالة للتحقق من التفعيل بدون التسبب في تكرار
CREATE OR REPLACE FUNCTION public.is_approved_v3(u_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = u_id AND is_approved = true
  );
$$;

-- ==========================================
-- 3. سياسات البروفايلات (Profiles) - الحل الجذري للتكرار
-- نقوم بتقسيم السياسات بحيث لا تستدعي السياسة نفسها وظيفة تبحث في نفس الجدول
-- ==========================================

-- الجميع يمكنهم رؤية بروفايلاتهم الخاصة دائماً (أساسي)
CREATE POLICY "profiles_self_access" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- المدير يمكنه رؤية جميع البروفايلات
-- نستخدم استعلام مباشر بدلاً من الدالة لمنع التعقيد في هذا الجدول تحديداً
CREATE POLICY "profiles_admin_access" ON public.profiles 
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "profiles_insert_basic" ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_logic" ON public.profiles FOR UPDATE 
USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- 4. سياسات الجداول الأخرى (Students, Lessons, Payments)
-- هنا يمكننا استخدام الوظائف بأمان لأنها لا تسبب تكراراً متقاطعاً مع البروفايلات
-- ==========================================

-- الطلاب
CREATE POLICY "students_all_v3" ON public.students FOR ALL 
USING (
  auth.uid() = teacher_id 
  OR 
  public.is_admin_v3(auth.uid())
);

-- الدروس
CREATE POLICY "lessons_all_v3" ON public.lessons FOR ALL 
USING (
  auth.uid() = teacher_id 
  OR 
  public.is_admin_v3(auth.uid())
);

-- المدفوعات
CREATE POLICY "payments_all_v3" ON public.payments FOR ALL 
USING (
  auth.uid() = teacher_id 
  OR 
  public.is_admin_v3(auth.uid())
);

-- ==========================================
-- 5. تحديث المدير الافتراضي
-- ==========================================
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
