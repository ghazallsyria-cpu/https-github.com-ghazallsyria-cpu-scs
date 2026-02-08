
-- دالة متطورة لجلب لوحة تحكم ولي الأمر/الطالب
-- تبحث عن رقم الهاتف داخل حقل jsonb الخاص بجدول الطلاب
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
        s.id as student_id,
        s.name as student_name,
        s.grade as grade,
        s.group_name as group_name,
        p.full_name as teacher_name,
        p.subjects as teacher_subjects,
        COALESCE((SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id), 0)::BIGINT as total_lessons,
        COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)::NUMERIC as total_paid,
        CASE 
            WHEN s.is_hourly THEN 
                (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * COALESCE(s.price_per_hour, 0)) - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
            ELSE 
                COALESCE(s.agreed_amount, 0) - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
        END::NUMERIC as remaining_balance
    FROM public.students s
    JOIN public.profiles p ON s.teacher_id = p.id
    WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(s.phones) AS phone_obj 
        WHERE phone_obj->>'number' = parent_phone_val
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
