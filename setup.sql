
-- 1. تنظيف شامل للبيئة
DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_user_metadata();
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. وظيفة للتحقق من صلاحية المدير (بسرعة وبدون تكرار)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تريجر لمزامنة الدور من جدول البروفايلات إلى نظام Auth (حل مشكلة عدم عمل الصلاحيات)
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object('role', NEW.role, 'full_name', NEW.full_name)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_role_update
AFTER UPDATE OF role, full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata();

-- 4. إعادة تهيئة السياسات لجدول البروفايلات (Profiles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ 
DECLARE pol record;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
    LOOP EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. إعادة تهيئة السياسات لجدول الطلاب (Students)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DO $$ 
DECLARE pol record;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'students') 
    LOOP EXECUTE format('DROP POLICY %I ON public.students', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "students_access_v5" ON public.students
FOR ALL USING (
  teacher_id = auth.uid() 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 6. تطبيق السياسات على الحصص والدفعات
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_access" ON public.lessons;
CREATE POLICY "lessons_access" ON public.lessons FOR ALL USING (teacher_id = auth.uid() OR is_admin());

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_access" ON public.payments;
CREATE POLICY "payments_access" ON public.payments FOR ALL USING (teacher_id = auth.uid() OR is_admin());

-- 7. تحديث يدوي لبيانات المدير (في حال وجوده مسبقاً) لضمان تفعيل الصلاحيات
-- ملاحظة: هذا سيقوم بتحديث أي حساب دوره 'admin' في جدول البروفايلات ليعمل في نظام الصلاحيات الجديد
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'admin');

-- 8. منح الصلاحيات اللازمة
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
