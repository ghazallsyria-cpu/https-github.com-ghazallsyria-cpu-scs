-- 1. تنظيف شامل للعناصر القديمة لمنع أي تعارض هيكلي
DROP VIEW IF EXISTS public.student_summary_view CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;

-- 2. وظيفة فحص المدير (SECURITY DEFINER) لمنع الدوران اللانهائي في السياسات
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. التأكد من هيكل الجداول الأساسية
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

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  duration_hours numeric DEFAULT 1,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. تفعيل وتعريف سياسات الأمان RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_profiles" ON public.profiles;
CREATE POLICY "access_profiles" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id OR check_is_admin());

DROP POLICY IF EXISTS "access_students" ON public.students;
CREATE POLICY "access_students" ON public.students FOR ALL TO authenticated USING (teacher_id = auth.uid() OR check_is_admin());

DROP POLICY IF EXISTS "access_lessons" ON public.lessons;
CREATE POLICY "access_lessons" ON public.lessons FOR ALL TO authenticated USING (teacher_id = auth.uid() OR check_is_admin());

DROP POLICY IF EXISTS "access_payments" ON public.payments;
CREATE POLICY "access_payments" ON public.payments FOR ALL TO authenticated USING (teacher_id = auth.uid() OR check_is_admin());

DROP POLICY IF EXISTS "access_schedules" ON public.schedules;
CREATE POLICY "access_schedules" ON public.schedules FOR ALL TO authenticated USING (teacher_id = auth.uid() OR check_is_admin());

-- 5. مشغل تلقائي لإنشاء البروفايل وترقية المدير (55315661)
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
    role = CASE WHEN EXCLUDED.phone = '55315661' THEN 'admin' ELSE profiles.role END,
    is_approved = CASE WHEN EXCLUDED.phone = '55315661' THEN true ELSE profiles.is_approved END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ترقية يدوية فورية لحساب المدير لضمان الدخول
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';

-- 7. إنشاء عرض ملخص الطلاب (View) من الصفر لضمان ترتيب الأعمدة وحساب الميزانية
CREATE VIEW public.student_summary_view AS
SELECT 
    s.id,
    s.teacher_id,
    s.name,
    s.grade,
    s.phones,
    s.address,
    s.school_name,
    s.agreed_amount,
    s.is_hourly,
    s.price_per_hour,
    s.is_completed,
    s.academic_year,
    s.semester,
    s.created_at,
    (SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id) as total_lessons,
    (SELECT COALESCE(SUM(l.hours), 0) FROM public.lessons l WHERE l.student_id = s.id) as total_hours,
    (SELECT COALESCE(SUM(p.amount), 0) FROM public.payments p WHERE p.student_id = s.id) as total_paid,
    (CASE 
        WHEN s.is_hourly THEN 
          (SELECT COALESCE(SUM(l.hours), 0) * s.price_per_hour FROM public.lessons l WHERE l.student_id = s.id) - (SELECT COALESCE(SUM(p.amount), 0) FROM public.payments p WHERE p.student_id = s.id)
        ELSE 
          s.agreed_amount - (SELECT COALESCE(SUM(p.amount), 0) FROM public.payments p WHERE p.student_id = s.id)
    END) as remaining_balance
FROM public.students s;