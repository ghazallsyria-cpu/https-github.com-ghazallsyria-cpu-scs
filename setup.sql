
-- 1. تحديث جدول الحسابات (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name text,
    phone text UNIQUE,
    role text DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'parent')),
    subjects text,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. وظيفة المزامنة التلقائية (هذه أهم خطوة لإصلاح اختفاء الحسابات)
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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل التريجر
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. إصلاح سياسات الأمان (RLS) بدون تكرار (Recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- سياسة الطلاب (المدير يرى كل شيء والمعلم يرى طلابه)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students access policy" ON public.students;
CREATE POLICY "Students access policy" ON public.students
  FOR ALL USING (
    teacher_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. تحديث الـ View ليكون أكثر مرونة
DROP VIEW IF EXISTS public.student_summary_view;
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(p.full_name, 'نظام القمة') as teacher_name,
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

-- ملاحظة للمستخدم: لجعل حسابك مديراً، نفذ هذا السطر يدوياً في SQL Editor:
-- UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = 'رقم_هاتفك';
