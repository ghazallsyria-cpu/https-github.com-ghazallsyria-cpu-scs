
-- ==========================================
-- 1. إنشاء الجداول الأساسية
-- ==========================================

-- جدول البروفايلات (المعلمين والمديرين)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'teacher', -- 'admin' or 'teacher'
  gender TEXT DEFAULT 'male',
  is_approved BOOLEAN DEFAULT false,
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
  agreed_amount NUMERIC DEFAULT 0, -- لطلاب الاتفاق الفصلي
  is_hourly BOOLEAN DEFAULT false, -- هل الطالب بنظام الساعة؟
  price_per_hour NUMERIC DEFAULT 0, -- سعر الساعة للطلاب الخارجيين
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الدروس (الحصص)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_date DATE DEFAULT CURRENT_DATE,
  hours NUMERIC DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المدفوعات النقدية
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
-- 2. تفعيل الحماية والسياسات (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- وظيفة للتحقق من هوية المدير
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END; $$;

-- سياسات البروفايلات
CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "View all profiles" ON public.profiles FOR SELECT USING (true);

-- سياسات الطلاب (المعلم يرى طلابه، المدير يرى الجميع)
CREATE POLICY "Students access" ON public.students FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- سياسات الدروس
CREATE POLICY "Lessons access" ON public.lessons FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- سياسات المدفوعات
CREATE POLICY "Payments access" ON public.payments FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- سياسات الأكواد
CREATE POLICY "Admin codes control" ON public.activation_codes FOR ALL USING (public.is_admin());
CREATE POLICY "Public codes view" ON public.activation_codes FOR SELECT USING (true);
CREATE POLICY "Public codes update" ON public.activation_codes FOR UPDATE USING (true);

-- ==========================================
-- 3. تنصيب المدير الأساسي
-- ==========================================
-- يرجى تحديث رقم الهاتف هذا ليتطابق مع رقمك عند أول تسجيل
-- UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
