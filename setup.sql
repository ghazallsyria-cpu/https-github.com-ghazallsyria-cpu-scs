
-- ==========================================
-- 1. التأكد من هيكلية الجداول الأساسية
-- ==========================================

-- جدول البروفايلات
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'teacher',
  gender TEXT,
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
  agreed_amount NUMERIC DEFAULT 0,
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
  notes TEXT, -- العمود المسبب للمشكلة
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. معالجة ذكية للأعمدة المفقودة أو المتغيرة
-- ==========================================
DO $$ 
BEGIN
  -- التأكد من عمود الملاحظات في المدفوعات
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'notes') THEN
    ALTER TABLE public.payments ADD COLUMN notes TEXT;
  END IF;

  -- التأكد من عمود agreed_amount في الطلاب (تحويل من الاسم القديم إن وجد)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'agreed_payment') THEN
    ALTER TABLE public.students RENAME COLUMN agreed_payment TO agreed_amount;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'agreed_amount') THEN
    ALTER TABLE public.students ADD COLUMN agreed_amount NUMERIC DEFAULT 0;
  END IF;

  -- ضمان القيم الافتراضية
  ALTER TABLE public.students ALTER COLUMN agreed_amount SET DEFAULT 0;
END $$;

-- ==========================================
-- 3. تصفية وتحديث سياسات الأمان (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة لتجنب التكرار
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'students', 'lessons', 'payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- وظيفة التحقق من رتبة المدير
CREATE OR REPLACE FUNCTION public.check_is_admin() 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END; $$;

-- سياسات الوصول الجديدة
CREATE POLICY "p_profiles_all" ON public.profiles FOR ALL USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "p_profiles_view_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "p_students_access" ON public.students FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());
CREATE POLICY "p_lessons_access" ON public.lessons FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());
CREATE POLICY "p_payments_access" ON public.payments FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());

-- ترقية المدير النهائي (تأكد من الرقم الصحيح)
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';

-- ==========================================
-- 4. إجبار تحديث الـ Schema Cache
-- ==========================================
-- أي تغيير في هيكل الجدول يرسل إشارة لـ PostgREST لتحديث الكاش تلقائياً
COMMENT ON TABLE public.payments IS 'Table for tracking student payments';
