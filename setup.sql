-- [V9] تحديث سياسات الطلاب لضمان سهولة الإضافة
-- هذا الملف يعالج مشاكل الصلاحيات التي قد تمنع إضافة طلاب جدد

-- 1. التأكد من صلاحيات الإضافة لجدول الطلاب
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students access" ON public.students;
DROP POLICY IF EXISTS "Allow teachers to insert their own students" ON public.students;
DROP POLICY IF EXISTS "Allow teachers to view/edit their own students" ON public.students;
DROP POLICY IF EXISTS "Allow admins full access to students" ON public.students;

-- سياسة الإضافة: تسمح لأي مستخدم مسجل بإضافة طالب بشرط أن يكون هو المعلم
CREATE POLICY "Allow teachers to insert their own students" 
ON public.students FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- سياسة الرؤية والتعديل والحذف
CREATE POLICY "Allow teachers to view/edit their own students" 
ON public.students FOR ALL 
USING (auth.uid() = teacher_id);

-- سياسة المدير العام: صلاحيات مطلقة
CREATE POLICY "Allow admins full access to students" 
ON public.students FOR ALL 
USING (public.is_admin_check(auth.uid()));

-- 2. دالة وتريجر لضمان وجود الملف الشخصي تلقائياً عند تسجيل أي مستخدم جديد (Fix لـ User already registered)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'معلم جديد'), 
    COALESCE(NEW.raw_user_meta_data->>'phone', '00000000'),
    'teacher',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل التريجر على جدول المستخدمين الخاص بـ Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- تحديث عرض الملخص لضمان سرعة الاستجابة
DROP VIEW IF EXISTS public.student_summary_view;
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(l.total_lessons, 0) AS total_lessons,
    COALESCE(l.total_hours, 0) AS total_hours,
    COALESCE(p.total_paid, 0) AS total_paid,
    CASE 
        WHEN s.is_hourly THEN (COALESCE(l.total_hours, 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END AS expected_income,
    (CASE 
        WHEN s.is_hourly THEN (COALESCE(l.total_hours, 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END) - COALESCE(p.total_paid, 0) AS remaining_balance
FROM public.students s
LEFT JOIN (
    SELECT student_id, COUNT(*) AS total_lessons, SUM(hours) AS total_hours 
    FROM public.lessons 
    GROUP BY student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT student_id, SUM(amount) AS total_paid 
    FROM public.payments 
    GROUP BY student_id
) p ON s.id = p.student_id;