
-- 1. وظيفة تطهير الأرقام (تستخدم في البحث والمقارنة)
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text AS $$
BEGIN
    -- إزالة كل شيء ليس رقماً (المسافات، +، -)
    RETURN regexp_replace(p_phone, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. دالة التحقق الذكي لولي الأمر (بدون Auth)
-- تعيد بيانات الطالب إذا كان الرقم موجوداً في مصفوفة الهواتف
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
    AND s.is_completed = false
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تحديث صلاحيات الوصول (RLS) لتسمح لولي الأمر (عبر الرقم) بالقراءة
-- سنسمح بالوصول للـ anon (المستخدم غير المسجل) بشرط وجود دالة تتحقق من الرقم
-- ملحوظة: في نظام القمة، سنعتمد على دالة RPC لجلب البيانات لضمان الأمان
