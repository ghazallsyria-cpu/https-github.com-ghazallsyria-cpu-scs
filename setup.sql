
-- 1. تعطيل RLS مؤقتاً لتنظيف السياسات
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. حذف كافة السياسات المحتملة بأسماء مختلفة لتنظيف البيئة تماماً
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') 
    LOOP 
        EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname); 
    END LOOP; 
END $$;

-- 3. إعادة تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. بناء سياسات جديدة بسيطة ومباشرة (لا تسبب تكرار برمجياً)
-- الجميع (المسجلون) يمكنهم رؤية البروفايلات
CREATE POLICY "safe_select_profiles" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- المستخدم يمكنه إنشاء بروفايله الخاص
CREATE POLICY "safe_insert_profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- المستخدم يمكنه تحديث بياناته الخاصة
CREATE POLICY "safe_update_profiles" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. تحديث سياسة الطلاب لتكون مستقلة تماماً عن جدول البروفايلات (تستخدم JWT)
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'students' AND schemaname = 'public') 
    LOOP 
        EXECUTE format('DROP POLICY %I ON public.students', pol.policyname); 
    END LOOP; 
END $$;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_access_policy_v2" 
ON public.students FOR ALL 
USING (
  teacher_id = auth.uid() 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 6. تحديث جدول البروفايلات لضمان القيم الافتراضية
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'teacher',
ALTER COLUMN is_approved SET DEFAULT false;
