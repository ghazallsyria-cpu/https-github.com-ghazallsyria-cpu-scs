
-- ==========================================
-- 1. إنشاء الجداول الأساسية (إذا لم تكن موجودة)
-- ==========================================

-- جدول البروفايلات
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text UNIQUE,
  role text DEFAULT 'teacher',
  gender text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS public.students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  phone text,
  grade text,
  agreed_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- جدول الدروس
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_date date DEFAULT CURRENT_DATE,
  hours numeric DEFAULT 1,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric DEFAULT 0,
  payment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. تنظيف السياسات والوظائف
-- ==========================================
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_basic" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_logic" ON public.profiles;
DROP POLICY IF EXISTS "students_all_v3" ON public.students;
DROP POLICY IF EXISTS "lessons_all_v3" ON public.lessons;
DROP POLICY IF EXISTS "payments_all_v3" ON public.payments;

-- ==========================================
-- 3. وظائف الحماية (Security Definer)
-- ==========================================

-- التحقق من المدير (بدون استدعاء السياسات لتجنب التكرار)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ==========================================
-- 4. تفعيل RLS وسياسات الوصول
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- سياسات البروفايلات (مبسطة جداً لمنع الـ Recursion)
CREATE POLICY "p_select" ON public.profiles FOR SELECT USING (true); -- السماح بالقراءة للكل لتسهيل الربط
CREATE POLICY "p_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "p_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- سياسات الطلاب
CREATE POLICY "s_all" ON public.students FOR ALL USING (
  auth.uid() = teacher_id OR public.is_admin()
);

-- سياسات الدروس
CREATE POLICY "l_all" ON public.lessons FOR ALL USING (
  auth.uid() = teacher_id OR public.is_admin()
);

-- سياسات المدفوعات
CREATE POLICY "pay_all" ON public.payments FOR ALL USING (
  auth.uid() = teacher_id OR public.is_admin()
);

-- ==========================================
-- 5. تعيين المدير الرئيسي
-- ==========================================
-- تأكد من استبدال هذا الرقم برقم هاتفك المسجل لتصبح مديراً
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
