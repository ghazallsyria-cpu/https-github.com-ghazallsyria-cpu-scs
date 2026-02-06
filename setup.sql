-- تنظيف شامل للبيئة (Nuclear Clean-up)
DROP VIEW IF EXISTS public.student_summary_view CASCADE;
DROP FUNCTION IF EXISTS public.get_student_by_parent_phone(text) CASCADE;
DROP FUNCTION IF EXISTS public.verify_parent_access(text) CASCADE;
DROP FUNCTION IF EXISTS public.normalize_phone(text) CASCADE;

-- 1. وظيفة تطهير الأرقام (أساسية للبحث)
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text AS $$
BEGIN
    RETURN regexp_replace(p_phone, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. إعادة بناء مشهد ملخص الطلاب ليكون دقيقاً 100%
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0)::numeric as total_hours,
    COALESCE((SELECT COUNT(l.id) FROM public.lessons l WHERE l.student_id = s.id), 0)::bigint as total_lessons,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)::numeric as total_paid,
    CASE 
        WHEN s.is_hourly THEN 
            (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0)::numeric * COALESCE(s.price_per_hour, 0)) - 
            COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)::numeric
        ELSE 
            COALESCE(s.agreed_amount, 0) - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)::numeric
    END::numeric as remaining_balance
FROM public.students s;

-- 3. دالة التحقق الذكي لولي الأمر (تعديل نوع الإخراج ليتوافق مع الواجهة)
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

-- 4. دالة جلب البيانات لبوابة ولي الأمر
CREATE OR REPLACE FUNCTION public.get_student_by_parent_phone(phone_val text)
RETURNS TABLE (
    id uuid,
    name text,
    grade text,
    teacher_name text,
    remaining_balance numeric,
    total_lessons bigint,
    total_paid numeric,
    total_hours numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id, 
        v.name, 
        v.grade,
        p.full_name as teacher_name,
        v.remaining_balance,
        v.total_lessons,
        v.total_paid,
        v.total_hours
    FROM public.student_summary_view v
    JOIN public.profiles p ON v.teacher_id = p.id
    WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(v.phones) AS ph
        WHERE public.normalize_phone(ph->>'number') = public.normalize_phone(phone_val)
    )
    AND v.is_completed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;