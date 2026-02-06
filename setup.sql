
-- 1. تنظيف مسبق ذكي
DROP VIEW IF EXISTS public.student_summary_view CASCADE;

-- 2. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role text DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'parent')),
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  grade text NOT NULL,
  phones jsonb DEFAULT '[]',
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

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users ON DELETE CASCADE,
  lesson_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric DEFAULT 2,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
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

-- 3. تفعيل RLS (إذا لم يكن مفعلاً)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. حذف السياسات القديمة لتجنب أخطاء التكرار عند إعادة التشغيل
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_admin_policy" ON public.profiles;
    DROP POLICY IF EXISTS "students_master_access" ON public.students;
    DROP POLICY IF EXISTS "ops_access" ON public.lessons;
    DROP POLICY IF EXISTS "pays_access" ON public.payments;
END $$;

-- 5. إعادة إنشاء السياسات الأمنية
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated 
USING (auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

CREATE POLICY "profiles_admin_policy" ON public.profiles FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

CREATE POLICY "students_master_access" ON public.students FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661'
  OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(phones) AS p 
    WHERE p->>'number' = (auth.jwt() -> 'user_metadata' ->> 'phone')
  )
);

CREATE POLICY "ops_access" ON public.lessons FOR ALL TO authenticated USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');
CREATE POLICY "pays_access" ON public.payments FOR ALL TO authenticated USING (teacher_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'phone') = '55315661');

-- 6. معالجة الـ Trigger والوظائف بشكل آمن تماماً
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    new.raw_user_meta_data->>'phone',
    CASE 
      WHEN (new.raw_user_meta_data->>'phone' = '55315661') THEN 'admin' 
      WHEN (new.raw_user_meta_data->>'role' = 'parent') THEN 'parent'
      ELSE 'teacher' 
    END,
    CASE 
      WHEN (new.raw_user_meta_data->>'phone' = '55315661') THEN true 
      WHEN (new.raw_user_meta_data->>'role' = 'parent') THEN true -- أولياء الأمور مفعلين تلقائياً للمشاهدة
      ELSE false 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. العرض المالي الذكي (View)
CREATE OR REPLACE VIEW public.student_summary_view AS
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
