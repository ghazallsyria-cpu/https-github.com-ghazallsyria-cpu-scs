
-- ==========================================
-- 1. تنظيف السياسات القديمة لتجنب الأخطاء
-- ==========================================
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view all" ON public.profiles;
DROP POLICY IF EXISTS "Students security" ON public.students;
DROP POLICY IF EXISTS "Lessons security" ON public.lessons;
DROP POLICY IF EXISTS "Payments security" ON public.payments;
DROP POLICY IF EXISTS "Codes admin access" ON public.activation_codes;
DROP POLICY IF EXISTS "Codes teacher view" ON public.activation_codes;
DROP POLICY IF EXISTS "Codes teacher use" ON public.activation_codes;

-- ==========================================
-- 2. إنشاء الجداول الأساسية (إذا لم تكن موجودة)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'teacher', -- 'admin' or 'teacher'
  gender TEXT DEFAULT 'male',
  is_approved BOOLEAN DEFAULT false, -- افتراضياً معلق
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. تفعيل سياسات الحماية (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- دالة التحقق من المدير
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END; $$;

-- دالة التحقق من المعلم المفعل
CREATE OR REPLACE FUNCTION public.is_approved_teacher() 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true);
END; $$;

-- سياسات البروفايلات
CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles view all" ON public.profiles FOR SELECT USING (true);

-- سياسات الطلاب (مغلقة للمعلمين غير المفعلين)
CREATE POLICY "Students security" ON public.students FOR ALL USING (
  (teacher_id = auth.uid() AND public.is_approved_teacher()) OR public.is_admin()
);

-- سياسات الدروس
CREATE POLICY "Lessons security" ON public.lessons FOR ALL USING (
  (teacher_id = auth.uid() AND public.is_approved_teacher()) OR public.is_admin()
);

-- سياسات المدفوعات
CREATE POLICY "Payments security" ON public.payments FOR ALL USING (
  (teacher_id = auth.uid() AND public.is_approved_teacher()) OR public.is_admin()
);

-- سياسات أكواد التفعيل
CREATE POLICY "Codes admin access" ON public.activation_codes FOR ALL USING (public.is_admin());
CREATE POLICY "Codes teacher view" ON public.activation_codes FOR SELECT USING (true);
CREATE POLICY "Codes teacher use" ON public.activation_codes FOR UPDATE USING (NOT is_used);
