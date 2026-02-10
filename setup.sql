
-- 1. إضافة وظيفة ترحيل الطلاب الذكية
CREATE OR REPLACE FUNCTION public.migrate_students(
    student_ids UUID[],
    target_year TEXT,
    target_semester TEXT,
    copy_financials BOOLEAN,
    copy_lessons BOOLEAN
) RETURNS VOID AS $$
DECLARE
    s_id UUID;
    new_student_id UUID;
BEGIN
    FOREACH s_id IN ARRAY student_ids LOOP
        -- إنشاء نسخة من الطالب في السنة/الفصل الجديد
        INSERT INTO public.students (
            teacher_id, name, address, phones, grade, group_name, 
            academic_year, semester, agreed_amount, is_hourly, price_per_hour
        )
        SELECT 
            teacher_id, name, address, phones, grade, group_name, 
            target_year, target_semester, agreed_amount, is_hourly, price_per_hour
        FROM public.students WHERE id = s_id
        RETURNING id INTO new_student_id;

        -- إذا تم اختيار نسخ البيانات المالية (المدفوعات)
        IF copy_financials THEN
            INSERT INTO public.payments (student_id, teacher_id, amount, payment_date, payment_method, notes)
            SELECT new_student_id, teacher_id, amount, payment_date, payment_method, 'ترحيل من سنة سابقة: ' || notes
            FROM public.payments WHERE student_id = s_id;
        END IF;

        -- إذا تم اختيار نسخ سجل الحصص
        IF copy_lessons THEN
            INSERT INTO public.lessons (student_id, teacher_id, lesson_date, hours, notes)
            SELECT new_student_id, teacher_id, lesson_date, hours, 'ترحيل: ' || notes
            FROM public.lessons WHERE student_id = s_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. تحديث العرض المالي ليشمل فلترة السنة والفصل بشكل أكثر دقة
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE((SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id), 0) AS total_lessons,
    COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) AS total_hours_taught,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0) AS total_paid,
    CASE 
        WHEN s.is_hourly THEN (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END AS expected_total,
    CASE 
        WHEN s.is_hourly THEN (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour) - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
        ELSE s.agreed_amount - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
    END AS remaining_balance
FROM public.students s;
