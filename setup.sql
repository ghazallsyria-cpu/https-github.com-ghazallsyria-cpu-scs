-- 1. تنظيف شامل للمشغلات والسياسات القديمة
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. إنشاء وظيفة للتحقق من المدير (تمنع الدوران اللانهائي)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text UNIQUE,
  role text DEFAULT 'teacher',
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  grade text,
  phones jsonb DEFAULT '[]',
  address text,
  school_name text,
  agreed_amount numeric DEFAULT 0,
  is_hourly boolean DEFAULT false,
  price_per_hour numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  academic_year text,
  semester text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  lesson_date date NOT NULL,
  hours numeric DEFAULT 1,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  payment_number text,
  is_final boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users,
  title text,
  body text,
  targets uuid[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activation_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. تفعيل نظام الأمان RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 5. سياسات الوصول الجديدة (بدون دوران لانهائي)

-- PROFILES
DROP POLICY IF EXISTS "Profiles Access" ON public.profiles;
CREATE POLICY "Profiles Access" ON public.profiles FOR ALL TO authenticated
USING ( auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- STUDENTS
DROP POLICY IF EXISTS "Students Access" ON public.students;
CREATE POLICY "Students Access" ON public.students FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- LESSONS
DROP POLICY IF EXISTS "Lessons Access" ON public.lessons;
CREATE POLICY "Lessons Access" ON public.lessons FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- PAYMENTS
DROP POLICY IF EXISTS "Payments Access" ON public.payments;
CREATE POLICY "Payments Access" ON public.payments FOR ALL TO authenticated
USING ( teacher_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- BROADCAST
DROP POLICY IF EXISTS "Broadcast Access" ON public.broadcast_messages;
CREATE POLICY "Broadcast Access" ON public.broadcast_messages FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = ANY(targets) );

-- CODES
DROP POLICY IF EXISTS "Codes Access" ON public.activation_codes;
CREATE POLICY "Codes Access" ON public.activation_codes FOR ALL TO authenticated
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- 6. المشغل المطور للمستخدمين الجدد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE WHEN (new.raw_user_meta_data->>'phone') = '55315661' THEN 'admin' ELSE 'teacher' END,
    CASE WHEN (new.raw_user_meta_data->>'phone') = '55315661' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = CASE WHEN EXCLUDED.phone = '55315661' THEN 'admin' ELSE profiles.role END,
    is_approved = CASE WHEN EXCLUDED.phone = '55315661' THEN true ELSE profiles.is_approved END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. الترقية الفورية للمدير
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';