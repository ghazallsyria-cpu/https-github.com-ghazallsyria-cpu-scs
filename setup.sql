
-- تنظيف شامل للسياسات القديمة لتجنب أخطاء التكرار
DO $$ 
BEGIN
    -- جداول السياسات
    EXECUTE (SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON ' || quote_ident(schemaname) || '.' || quote_ident(tablename) || ';', ' ')
             FROM pg_policies 
             WHERE schemaname = 'public' AND (tablename = 'profiles' OR tablename = 'students' OR tablename = 'lessons' OR tablename = 'payments' OR tablename = 'activation_codes'));
END $$;

-- إنشاء جدول البروفايلات (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'teacher', -- 'admin' or 'teacher'
  gender TEXT DEFAULT 'male',
  is_approved BOOLEAN DEFAULT false, -- الحالة الافتراضية معلق
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول أكواد التفعيل
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل الحماية على مستوى الصف
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- دوال التحقق المتقدمة
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END; $$;

CREATE OR REPLACE FUNCTION public.is_approved_teacher() 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true);
END; $$;

-- إنشاء السياسات الجديدة
CREATE POLICY "Profiles_Full_Access_Admin" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Profiles_Self_Access" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Profiles_Public_View" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Codes_Admin_Control" ON public.activation_codes FOR ALL USING (public.is_admin());
CREATE POLICY "Codes_Select_Any" ON public.activation_codes FOR SELECT USING (true);
CREATE POLICY "Codes_Update_Unused" ON public.activation_codes FOR UPDATE USING (NOT is_used);

-- سياسات الجداول التشغيلية (الطلاب، الدروس، المدفوعات)
-- سيتم ربطها بـ is_approved_teacher لضمان عدم ظهور بيانات للمعلم غير المفعل
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students_Strict_Access" ON public.students FOR ALL USING (
  (teacher_id = auth.uid() AND public.is_approved_teacher()) OR public.is_admin()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons_Strict_Access" ON public.lessons FOR ALL USING (
  (teacher_id = auth.uid() AND public.is_approved_teacher()) OR public.is_admin()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments_Strict_Access" ON public.payments FOR ALL USING (
  (teacher_id = auth.uid() AND public.is_approved_teacher()) OR public.is_admin()
);
