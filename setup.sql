-- 1. تنظيف شامل للوظائف السابقة لضمان التحديث
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. وظيفة معالجة المستخدمين الجدد (تنشأ تلقائياً عند التسجيل)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN (new.raw_user_meta_data->>'phone') = '55315661' THEN 'admin' 
      ELSE 'teacher' 
    END,
    CASE 
      WHEN (new.raw_user_meta_data->>'phone') = '55315661' THEN true 
      ELSE false 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = CASE WHEN EXCLUDED.phone = '55315661' THEN 'admin' ELSE profiles.role END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تفعيل المشغل (Trigger)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. إصلاح جدول Profiles لضمان عدم وجود أخطاء في القيود
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'teacher', 'parent'));

-- 5. تحديث كافة الدوال الأمنية لولي الأمر لضمان الدقة
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text AS $$
BEGIN
    RETURN regexp_replace(p_phone, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.verify_parent_access(phone_to_check text)
RETURNS TABLE (student_id uuid, student_name text, teacher_name text, grade text) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, p.full_name, s.grade
    FROM public.students s
    JOIN public.profiles p ON s.teacher_id = p.id
    WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(s.phones) AS ph
        WHERE public.normalize_phone(ph->>'number') = public.normalize_phone(phone_to_check)
    )
    AND s.is_completed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;