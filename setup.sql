
-- 1. وظيفة لجلب أولياء الأمور المرتبطين بمعلم معين
CREATE OR REPLACE FUNCTION public.get_teacher_parents(teacher_uuid uuid)
RETURNS TABLE (
    parent_id uuid,
    parent_name text,
    parent_phone text,
    student_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as parent_id,
        p.full_name as parent_name,
        p.phone as parent_phone,
        s.name as student_name
    FROM public.profiles p
    JOIN public.students s ON s.phones @> jsonb_build_array(jsonb_build_object('number', p.phone))
    WHERE s.teacher_id = teacher_uuid AND p.role = 'parent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. وظيفة لجلب المعلمين المرتبطين بولي أمر معين
CREATE OR REPLACE FUNCTION public.get_parent_teachers(parent_phone_val text)
RETURNS TABLE (
    teacher_id uuid,
    teacher_name text,
    subject text,
    student_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as teacher_id,
        p.full_name as teacher_name,
        p.subjects as subject,
        s.name as student_name
    FROM public.profiles p
    JOIN public.students s ON s.teacher_id = p.id
    WHERE s.phones @> jsonb_build_array(jsonb_build_object('number', parent_phone_val))
    AND p.role = 'teacher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
