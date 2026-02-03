
-- ==========================================
-- 1. تنظيف السياسات القديمة بالكامل
-- ==========================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "profile_update" ON public.profiles;
DROP POLICY IF EXISTS "insert_student" ON public.students;
DROP POLICY IF EXISTS "select_student" ON public.students;
DROP POLICY IF EXISTS "delete_student" ON public.students;
DROP POLICY IF EXISTS "insert_lesson" ON public.lessons;
DROP POLICY IF EXISTS "select_lesson" ON public.lessons;
DROP POLICY IF EXISTS "insert_payment" ON public.payments;
DROP POLICY IF EXISTS "select_payment" ON public.payments;

-- ==========================================
-- 2. إنشاء وظائف آمنة تتجاوز الـ RLS (Security Definer)
-- هذه الوظائف هي المفتاح لمنع خطأ الـ Infinite Recursion
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_approved() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_approved, false)
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- ==========================================
-- 3. تفعيل الحماية على الجداول
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. سياسات جدول البروفايلات (Profiles)
-- ==========================================
CREATE POLICY "p_select_policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "p_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "p_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- ==========================================
-- 5. سياسات جدول الطلاب (Students)
-- ==========================================
CREATE POLICY "s_insert_policy" ON public.students FOR INSERT WITH CHECK (auth.uid() = teacher_id AND is_approved());
CREATE POLICY "s_select_policy" ON public.students FOR SELECT USING (auth.uid() = teacher_id OR is_admin());
CREATE POLICY "s_delete_policy" ON public.students FOR DELETE USING (auth.uid() = teacher_id OR is_admin());
CREATE POLICY "s_update_policy" ON public.students FOR UPDATE USING (auth.uid() = teacher_id OR is_admin());

-- ==========================================
-- 6. سياسات الدروس والمالية (Lessons & Payments)
-- ==========================================
CREATE POLICY "l_insert_policy" ON public.lessons FOR INSERT WITH CHECK (auth.uid() = teacher_id AND is_approved());
CREATE POLICY "l_select_policy" ON public.lessons FOR SELECT USING (auth.uid() = teacher_id OR is_admin());
CREATE POLICY "pay_insert_policy" ON public.payments FOR INSERT WITH CHECK (auth.uid() = teacher_id AND is_approved());
CREATE POLICY "pay_select_policy" ON public.payments FOR SELECT USING (auth.uid() = teacher_id OR is_admin());

-- ==========================================
-- 7. تعيين المدير العام (رقمك المعتمد)
-- ==========================================
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
