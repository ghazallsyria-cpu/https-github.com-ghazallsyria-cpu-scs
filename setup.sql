
-- 1. إسقاط الدالة القديمة لتجنب تعارض الأنواع
DROP FUNCTION IF EXISTS public.get_parent_dashboard(text);

-- 2. تحديث View ملخص الطلاب (تأكد من وجودها وتحديثها)
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.id,
    s.teacher_id,
    s.name,
    s.grade,
    s.group_name,
    s.academic_year,
    s.semester,
    s.agreed_amount,
    s.is_hourly,
    s.price_per_hour,
    s.phones,
    COALESCE((SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id), 0) AS total_lessons,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0) AS total_paid,
    CASE 
        WHEN s.is_hourly THEN 
            (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour) - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
        ELSE 
            s.agreed_amount - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
    END AS remaining_balance
FROM public.students s;

-- 3. إعادة إنشاء دالة بوابة الطالب/ولي الأمر
CREATE OR REPLACE FUNCTION public.get_parent_dashboard(parent_phone_val TEXT)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    grade TEXT,
    group_name TEXT,
    teacher_name TEXT,
    teacher_subjects TEXT,
    total_lessons BIGINT,
    total_paid NUMERIC,
    remaining_balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as student_id,
        v.name as student_name,
        v.grade as grade,
        v.group_name as group_name,
        p.full_name as teacher_name,
        p.subjects as teacher_subjects,
        v.total_lessons::BIGINT,
        v.total_paid::NUMERIC,
        v.remaining_balance::NUMERIC
    FROM public.student_summary_view v
    JOIN public.profiles p ON v.teacher_id = p.id
    WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(v.phones) AS phone_obj 
        WHERE phone_obj->>'number' = parent_phone_val
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
