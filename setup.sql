
-- 1. تنظيف شامل
DROP VIEW IF EXISTS public.student_summary_view CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. جدول الملفات الشخصية
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role text DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'parent')),
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. جدول الطلاب (العصب الرئيسي)
CREATE TABLE public.students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  grade text NOT NULL,
  phones jsonb DEFAULT '[]', -- [{number: '...', label: '...'}]
  address text,
  school_name text,
  agreed_amount numeric DEFAULT 0,
  is_hourly boolean DEFAULT false,
  price_per_hour numeric DEFAULT 0,
  is_completed boolean DEFAULT false,
  academic_year text NOT NULL,
  semester text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. جداول العمليات (حصص، مدفوعات، جداول)
CREATE TABLE public.lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  lesson_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric DEFAULT 2,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'كاش',
  payment_number text,
  is_final boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  duration_hours numeric DEFAULT 1.5,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. تفعيل الأمن (RLS) وسياسات "اللا عودة"
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- سياسات البروفايلات: التحقق من الهاتف مباشرة من التوكن لمنع Recursion
CREATE POLICY "profiles_view_policy" ON public.profiles FOR SELECT TO authenticated 
USING (auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

CREATE POLICY "profiles_mod_policy" ON public.profiles FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

-- سياسات الطلاب: المعلم يرى طلابه، المدير يرى الكل، ولي الأمر يرى عبر رقم هاتفه
CREATE POLICY "students_master_policy" ON public.students FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661'
  OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(phones) AS p 
    WHERE p->>'number' = (auth.jwt() -> 'user_metadata' ->> 'phone')
  )
);

-- سياسات العمليات: المعلم يرى عملياته، والمدير يرى كل شيء
CREATE POLICY "lessons_master_policy" ON public.lessons FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

CREATE POLICY "payments_master_policy" ON public.payments FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

CREATE POLICY "schedules_master_policy" ON public.schedules FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

-- 6. مشغل إنشاء البروفايل (Security Definer)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    new.raw_user_meta_data->>'phone',
    CASE WHEN (new.raw_user_meta_data->>'phone' = '55315661') THEN 'admin' ELSE 'teacher' END,
    CASE WHEN (new.raw_user_meta_data->>'phone' = '55315661') THEN true ELSE false END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. العرض المالي الذكي (View)
CREATE VIEW public.student_summary_view AS
SELECT 
    s.*,
    (SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id) as total_lessons,
    (SELECT COALESCE(SUM(l.hours), 0) FROM public.lessons l WHERE l.student_id = s.id) as total_hours,
    (SELECT COALESCE(SUM(p.amount), 0) FROM public.payments p WHERE p.student_id = s.id) as total_paid,
    (CASE 
        WHEN s.is_hourly THEN (SELECT COALESCE(SUM(l.hours), 0) * s.price_per_hour FROM public.lessons l WHERE l.student_id = s.id)
        ELSE s.agreed_amount 
    END) - (SELECT COALESCE(SUM(p.amount), 0) FROM public.payments p WHERE p.student_id = s.id) as remaining_balance
FROM public.students s;
