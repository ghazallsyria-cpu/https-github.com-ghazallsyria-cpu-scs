
-- 1. تعطيل RLS لتنظيف الجداول
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- 2. حذف كافة السياسات الحالية لتجنب أي تداخل قديم
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'students', 'lessons', 'payments', 'schedules')) 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename); 
    END LOOP; 
END $$;

-- 3. تفعيل RLS من جديد
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. سياسات جدول البروفايلات (Profiles) - الحل الجذري للـ Recursion
-- القاعدة الذهبية: لا تستخدم (SELECT ... FROM profiles) داخل سياسة تخص جدول profiles نفسه.

-- السماح بالقراءة لجميع المستخدمين المسجلين (لأغراض الربط والبحث)
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- السماح للمستخدم بإدخال بياناته الخاصة فقط
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- السماح للمستخدم بتحديث بياناته الخاصة فقط (بناءً على UID المسجل في الجلسة)
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 5. سياسات جدول الطلاب (Students)
-- المعلم يرى طلابه، والمدير يرى الجميع (التحقق من الدور يتم عبر JWT Metadata لتجنب Recursion)
CREATE POLICY "students_all_policy" ON public.students
FOR ALL USING (
  teacher_id = auth.uid() 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 6. تطبيق نفس المنطق على الجداول المالية والتعليمية
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_all_policy" ON public.lessons
FOR ALL USING (
  teacher_id = auth.uid() 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_all_policy" ON public.payments
FOR ALL USING (
  teacher_id = auth.uid() 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 7. التأكد من صلاحيات الجداول للعامة (Authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
