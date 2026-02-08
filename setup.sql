
-- ======================================================
-- سكريبت إعداد قواعد الأمان والسياسات (RLS) لنظام القمة
-- ======================================================

-- 1. تفعيل نظام الأمان على الجداول الأساسية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 2. سياسات جدول الملفات الشخصية (Profiles)
CREATE POLICY "الكل يمكنه رؤية الملفات الشخصية" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "المستخدم يمكنه تحديث ملفه فقط" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "المدير يملك صلاحية كاملة على الملفات" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. سياسات جدول الطلاب (Students)
CREATE POLICY "المعلم يدير طلابه" ON public.students FOR ALL USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ولي الأمر يرى أبناءه" ON public.students FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'parent' AND phone = ANY(SELECT (p->>'number') FROM unnest(phones) AS p))
);

-- 4. سياسات جدول الحصص (Lessons)
CREATE POLICY "المعلم يدير حصصه" ON public.lessons FOR ALL USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. سياسات جدول المدفوعات (Payments)
CREATE POLICY "المعلم يدير مدفوعاته" ON public.payments FOR ALL USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. سياسات جدول المواعيد (Schedules) - حل مشكلة المواعيد
DROP POLICY IF EXISTS "المعلم يدير جدوله" ON public.schedules;
CREATE POLICY "المعلم يدير جدوله" ON public.schedules FOR ALL USING (
    teacher_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. تحديث الـ View المالية لضمان الدقة (مع COALESCE لمنع قيم Null)
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

-- منح الصلاحيات للـ View
GRANT SELECT ON public.student_summary_view TO authenticated;
GRANT SELECT ON public.student_summary_view TO anon;
