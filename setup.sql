
-- 1. تهيئة جدول البروفايلات مع التأكد من القيود
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name text,
    phone text UNIQUE,
    role text DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'parent')),
    subjects text,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. تفعيل RLS (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة لمنع التداخل
DROP POLICY IF EXISTS "Allow public read" ON public.profiles;
DROP POLICY IF EXISTS "Allow self update" ON public.profiles;
DROP POLICY IF EXISTS "Allow self insert" ON public.profiles;

-- سياسات البروفايلات
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. سياسة الطلاب (حل مشكلة التكرار Recursion)
-- نستخدم البيانات الوصفية من الـ JWT للتحقق من دور المدير لتجنب الاستعلام الدائري عن جدول البروفايلات
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students specialized access" ON public.students;
DROP POLICY IF EXISTS "Students access policy" ON public.students;

CREATE POLICY "Students access policy" ON public.students 
FOR ALL USING (
  teacher_id = auth.uid() 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 4. تفعيل التريجر (Trigger) كخط دفاع أول لضمان إنشاء البروفايل فوراً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, subjects, is_approved)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'teacher'),
    new.raw_user_meta_data->>'subjects',
    CASE 
      WHEN (new.raw_user_meta_data->>'role' = 'admin' OR new.raw_user_meta_data->>'role' = 'parent') THEN true 
      ELSE false 
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. تحديث الـ View لتعمل بكفاءة مع المدير
DROP VIEW IF EXISTS public.student_summary_view;
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(p.full_name, 'معلم غير معرف') as teacher_name,
    COALESCE(p.subjects, 'عام') as teacher_subjects,
    (SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id) as total_lessons,
    (SELECT COALESCE(SUM(l.hours), 0) FROM public.lessons l WHERE l.student_id = s.id) as total_hours,
    (SELECT COALESCE(SUM(pay.amount), 0) FROM public.payments pay WHERE pay.student_id = s.id) as total_paid,
    (CASE 
        WHEN s.is_hourly THEN (SELECT COALESCE(SUM(l.hours), 0) * s.price_per_hour FROM public.lessons l WHERE l.student_id = s.id)
        ELSE s.agreed_amount 
    END) - (SELECT COALESCE(SUM(pay.amount), 0) FROM public.payments pay WHERE pay.student_id = s.id) as remaining_balance
FROM public.students s
LEFT JOIN public.profiles p ON s.teacher_id = p.id;
