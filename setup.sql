-- 1. وظيفة تطهير الأرقام (تستخدم في البحث والمقارنة)
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text AS $$
BEGIN
    -- إزالة كل شيء ليس رقماً (المسافات، +، -)
    RETURN regexp_replace(p_phone, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. دالة التحقق الذكي لولي الأمر (تستخدم في تسجيل الدخول)
CREATE OR REPLACE FUNCTION public.verify_parent_access(phone_to_check text)
RETURNS TABLE (
    student_id uuid,
    student_name text,
    teacher_name text,
    grade text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        p.full_name as teacher_name,
        s.grade
    FROM public.students s
    JOIN public.profiles p ON s.teacher_id = p.id
    WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(s.phones) AS ph
        WHERE public.normalize_phone(ph->>'number') = public.normalize_phone(phone_to_check)
    )
    AND s.is_completed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. دالة جلب الطلاب لولي الأمر (تستخدم في البوابة الرئيسية للمتابعة)
CREATE OR REPLACE FUNCTION public.get_student_by_parent_phone(phone_val text)
RETURNS TABLE (
    id uuid,
    name text,
    grade text,
    teacher_name text,
    remaining_balance numeric,
    total_lessons bigint,
    total_paid numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, 
        s.name, 
        s.grade,
        p.full_name as teacher_name,
        COALESCE(v.remaining_balance, 0) as remaining_balance,
        COALESCE(v.total_lessons, 0) as total_lessons,
        COALESCE(v.total_paid, 0) as total_paid
    FROM public.students s
    JOIN public.profiles p ON s.teacher_id = p.id
    LEFT JOIN public.student_summary_view v ON s.id = v.id
    WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(s.phones) AS ph
        WHERE public.normalize_phone(ph->>'number') = public.normalize_phone(phone_val)
    )
    AND s.is_completed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;