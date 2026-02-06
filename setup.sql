-- 1. تنظيف البيئة القديمة لضمان عدم التعارض
DROP VIEW IF EXISTS public.student_summary_view;
DROP FUNCTION IF EXISTS public.get_student_by_parent_phone(text);
DROP FUNCTION IF EXISTS public.verify_parent_access(text);
DROP FUNCTION IF EXISTS public.normalize_phone(text);

-- 2. وظيفة تطهير الأرقام
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text AS $$
BEGIN
    RETURN regexp_replace(p_phone, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. بناء الجدول الأساسي للطلاب (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    address text,
    phones jsonb DEFAULT '[]'::jsonb,
    school_name text,
    grade text,
    agreed_amount numeric DEFAULT 0,
    is_hourly boolean DEFAULT false,
    price_per_hour numeric DEFAULT 0,
    is_completed boolean DEFAULT false,
    academic_year text,
    semester text,
    created_at timestamptz DEFAULT now()
);

-- 4. إنشاء مشهد ملخص الطلاب (القلب النابض للإحصائيات)
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) as total_hours,
    COALESCE((SELECT COUNT(l.id) FROM public.lessons l WHERE l.student_id = s.id), 0) as total_lessons,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0) as total_paid,
    CASE 
        WHEN s.is_hourly THEN 
            (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour) - 
            COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
        ELSE 
            s.agreed_amount - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
    END as remaining_balance
FROM public.students s;

-- 5. دالة التحقق لولي الأمر
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

-- 6. دالة جلب الطلاب لولي الأمر
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