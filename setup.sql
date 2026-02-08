
-- ======================================================
-- سكريبت إعداد نظام القمة V5.3 - الحل النهائي لصلاحيات المدير
-- ======================================================

-- 1. دالة التحقق من المدير (بدون تكرار نهائياً)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_adm BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_adm
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN COALESCE(is_adm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. دالة تلقائية لإنشاء ملف شخصي عند أي عملية تسجيل جديدة في Auth
-- هذا يضمن عدم ضياع أي مستخدم يسجل في النظام
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved, subjects)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'parent'),
    CASE WHEN (new.raw_user_meta_data->>'role') = 'parent' THEN true ELSE false END,
    COALESCE(new.raw_user_meta_data->>'subjects', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل الـ Trigger (يجب حذفه أولاً إذا كان موجوداً)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. سياسات جدول Profiles (المدير يرى كل شيء دائماً)
DROP POLICY IF EXISTS "Profiles_Select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Update_Self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Admin_All" ON public.profiles;

CREATE POLICY "Profiles_Admin_Master" ON public.profiles
FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Profiles_User_Read" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles_User_Update" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 5. سياسات جدول الطلاب (تعديل لضمان الشفافية للمدير)
DROP POLICY IF EXISTS "Students_Select" ON public.students;
CREATE POLICY "Students_Select_Master" ON public.students
FOR SELECT TO authenticated 
USING (
    is_admin() OR 
    teacher_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = 'parent' AND p.phone = ANY(SELECT (phone_obj->>'number') FROM jsonb_array_elements(students.phones) AS phone_obj)
    )
);

-- 6. تحديث الـ View (لضمان الدقة المالية)
DROP VIEW IF EXISTS public.student_summary_view CASCADE;
CREATE VIEW public.student_summary_view AS
SELECT 
    s.*,
    p.full_name as teacher_name,
    p.subjects as teacher_subjects,
    COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) as total_lessons,
    COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0) as total_paid,
    CASE 
        WHEN s.is_hourly THEN 
            (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * COALESCE(s.price_per_hour, 0)) - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
        ELSE 
            COALESCE(s.agreed_amount, 0) - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
    END as remaining_balance
FROM public.students s
LEFT JOIN public.profiles p ON s.teacher_id = p.id;

GRANT SELECT ON public.student_summary_view TO authenticated;
