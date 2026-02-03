
-- ==========================================
-- 1. جداول النظام الأساسية
-- ==========================================

-- جدول البروفايلات (المعلمين والمديرين)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'teacher', -- 'admin' or 'teacher'
  gender TEXT DEFAULT 'male',
  is_approved BOOLEAN DEFAULT false, -- الحالة الافتراضية معلق
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  grade TEXT,
  agreed_amount NUMERIC DEFAULT 0,
  is_hourly BOOLEAN DEFAULT false,
  price_per_hour NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الدروس
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_date DATE DEFAULT CURRENT_DATE,
  hours NUMERIC DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول أكواد التفعيل
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. تفعيل سياسات الحماية (RLS)
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

-- سياسات الطلاب
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
