
-- ==========================================
-- سكريبت تصفير النظام (Factory Reset)
-- يرجى استخدامه بحذر في SQL Editor
-- ==========================================

/* 
-- لتمكين التصفير اليدوي، قم بتحديد الأسطر التالية وتشغيلها:

-- 1. مسح الحصص والدفعات والجداول
TRUNCATE public.payments, public.lessons, public.schedules CASCADE;

-- 2. مسح الطلاب
TRUNCATE public.students CASCADE;

-- 3. مسح كافة الحسابات ما عدا المدير
DELETE FROM public.profiles WHERE role != 'admin';

*/

-- تحسين الـ View ليكون أسرع بعد التصفير
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
            (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour) - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
        ELSE 
            s.agreed_amount - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
    END as remaining_balance
FROM public.students s
LEFT JOIN public.profiles p ON s.teacher_id = p.id;
