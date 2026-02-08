
-- 1. تحديث جدول الطلاب بالأعمدة الماسية الجديدة
DO $$ 
BEGIN 
    -- التأكد من وجود عمود اسم المجموعة (المجلد)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='group_name') THEN
        ALTER TABLE public.students ADD COLUMN group_name TEXT;
    END IF;

    -- التأكد من وجود الأعمدة المالية
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='agreed_amount') THEN
        ALTER TABLE public.students ADD COLUMN agreed_amount NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='is_hourly') THEN
        ALTER TABLE public.students ADD COLUMN is_hourly BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='price_per_hour') THEN
        ALTER TABLE public.students ADD COLUMN price_per_hour NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2. تنظيف العروض القديمة لبناء العرض الماسي
DROP VIEW IF EXISTS public.student_summary_view CASCADE;

-- 3. إنشاء العرض المالي الماسي (The Diamond Financial View)
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE((SELECT COUNT(*) FROM public.lessons l WHERE l.student_id = s.id), 0) AS total_lessons,
    COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) AS total_hours_taught,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0) AS total_paid,
    -- القيمة المتوقعة (مقطوع أو بالساعة)
    CASE 
        WHEN s.is_hourly THEN (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END AS expected_total,
    -- صافي المديونية
    CASE 
        WHEN s.is_hourly THEN (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour) - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
        ELSE s.agreed_amount - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = s.id), 0)
    END AS remaining_balance
FROM public.students s;

-- 4. إعادة بناء وظيفة البحث في بوابة ولي الأمر لتكون أسرع وأدق
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
    remaining_balance NUMERIC,
    expected_total NUMERIC
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
        v.remaining_balance::NUMERIC,
        v.expected_total::NUMERIC
    FROM public.student_summary_view v
    JOIN public.profiles p ON v.teacher_id = p.id
    WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(v.phones) AS phone_obj 
        WHERE phone_obj->>'number' = parent_phone_val
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
