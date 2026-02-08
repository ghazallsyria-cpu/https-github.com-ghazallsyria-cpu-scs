
-- ======================================================
-- سكريبت إعداد نظام القمة V5.2 - حل مشكلة التكرار اللانهائي
-- ======================================================

-- 1. إنشاء دالة التحقق من المدير (تتجاوز RLS لمنع التكرار)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. تفعيل نظام الأمان على كافة الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 3. تنظيف السياسات القديمة (شاملة كافة المسميات السابقة)
DROP POLICY IF EXISTS "Profiles_Policy" ON public.profiles;
DROP POLICY IF EXISTS "Students_Teacher_Policy" ON public.students;
DROP POLICY IF EXISTS "Students_Parent_Policy" ON public.students;
DROP POLICY IF EXISTS "Lessons_Policy" ON public.lessons;
DROP POLICY IF EXISTS "Payments_Policy" ON public.payments;
DROP POLICY IF EXISTS "Schedules_Policy" ON public.schedules;

-- 4. سياسات جدول الملفات الشخصية (Profiles)
CREATE POLICY "Profiles_Select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles_Update_Self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles_Admin_All" ON public.profiles FOR ALL TO authenticated USING (is_admin());

-- 5. سياسات جدول الطلاب (Students)
CREATE POLICY "Students_Select" ON public.students FOR SELECT TO authenticated 
USING (teacher_id = auth.uid() OR is_admin() OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'parent' AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(students.phones) AS phone_obj WHERE phone_obj->>'number' = p.phone
    )
));

CREATE POLICY "Students_Insert" ON public.students FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() OR is_admin());
CREATE POLICY "Students_Update" ON public.students FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR is_admin());
CREATE POLICY "Students_Delete" ON public.students FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR is_admin());

-- 6. سياسات جدول الحصص (Lessons)
CREATE POLICY "Lessons_All" ON public.lessons FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR is_admin()) 
WITH CHECK (teacher_id = auth.uid() OR is_admin());

-- 7. سياسات جدول المدفوعات (Payments)
CREATE POLICY "Payments_All" ON public.payments FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR is_admin()) 
WITH CHECK (teacher_id = auth.uid() OR is_admin());

-- 8. سياسات جدول المواعيد (Schedules)
CREATE POLICY "Schedules_All" ON public.schedules FOR ALL TO authenticated 
USING (teacher_id = auth.uid() OR is_admin()) 
WITH CHECK (teacher_id = auth.uid() OR is_admin());

-- 9. تحديث الـ View المالية (Student Summary View)
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

-- منح الصلاحيات
GRANT SELECT ON public.student_summary_view TO authenticated;
GRANT SELECT ON public.student_summary_view TO anon;
