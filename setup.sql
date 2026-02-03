
-- ==========================================
-- 1. تنظيف شامل
-- ==========================================
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'students', 'lessons', 'payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ==========================================
-- 2. وظيفة الأمان (SECURITY DEFINER)
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ==========================================
-- 3. تفعيل RLS وسياسات الوصول الشاملة
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- سياسات البروفايلات
CREATE POLICY "p_profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "p_profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "p_profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "p_profiles_delete" ON public.profiles FOR DELETE USING (public.check_is_admin()); -- تم إضافة هذه السياسة

-- سياسات الجداول الأخرى
CREATE POLICY "p_students_all" ON public.students FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());
CREATE POLICY "p_lessons_all" ON public.lessons FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());
CREATE POLICY "p_payments_all" ON public.payments FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());

-- ==========================================
-- 4. الترقية الفورية للمدير
-- ==========================================
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
