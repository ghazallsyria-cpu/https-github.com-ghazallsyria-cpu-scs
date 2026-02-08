
-- ======================================================
-- سكريبت إعداد نظام القمة V5.1 - الإصدار الأمني المتكامل
-- ======================================================

-- 1. تفعيل نظام الأمان على كافة الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 2. تنظيف السياسات القديمة
DROP POLICY IF EXISTS "Profiles: View All" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Self Update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Admin All" ON public.profiles;
DROP POLICY IF EXISTS "Students: Teacher/Admin Manage" ON public.students;
DROP POLICY IF EXISTS "Students: Parent View" ON public.students;
DROP POLICY IF EXISTS "Lessons: Teacher/Admin Manage" ON public.lessons;
DROP POLICY IF EXISTS "Payments: Teacher/Admin Manage" ON public.payments;
DROP POLICY IF EXISTS "Schedules: Teacher/Admin Manage" ON public.schedules;
DROP POLICY IF EXISTS "الكل يمكنه رؤية الملفات الشخصية" ON public.profiles;
DROP POLICY IF EXISTS "المستخدم يمكنه تحديث ملفه فقط" ON public.profiles;
DROP POLICY IF EXISTS "المدير يملك صلاحية كاملة على الملفات" ON public.profiles;
DROP POLICY IF EXISTS "المعلم يدير طلابه" ON public.students;
DROP POLICY IF EXISTS "ولي الأمر يرى أبناءه" ON public.students;
DROP POLICY IF EXISTS "المعلم يدير حصصه" ON public.lessons;
DROP POLICY IF EXISTS "المعلم يدير مدفوعاته" ON public.payments;
DROP POLICY IF EXISTS "المعلم يدير جدوله" ON public.schedules;

-- 3. سياسات جدول الملفات الشخصية (Profiles)
CREATE POLICY "Profiles_Policy" ON public.profiles
FOR ALL TO authenticated
USING (true)
WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. سياسات جدول الطلاب (Students)
CREATE POLICY "Students_Teacher_Policy" ON public.students
FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students_Parent_Policy" ON public.students
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'parent'
        AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(students.phones) AS phone_obj
            WHERE phone_obj->>'number' = p.phone
        )
    )
);

-- 5. سياسات جدول الحصص (Lessons)
CREATE POLICY "Lessons_Policy" ON public.lessons
FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. سياسات جدول المدفوعات (Payments)
CREATE POLICY "Payments_Policy" ON public.payments
FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. سياسات جدول المواعيد (Schedules)
CREATE POLICY "Schedules_Policy" ON public.schedules
FOR ALL TO authenticated
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8. تحديث الـ View المالية (Student Summary View)
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
