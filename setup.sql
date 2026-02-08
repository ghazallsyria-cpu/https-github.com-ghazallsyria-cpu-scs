
-- 1. تنظيف السياسات القديمة للحذف
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all_actions" ON public.profiles;

-- 2. إنشاء سياسة "السلطة المطلقة" (Superpower Policy)
-- هذه السياسة تسمح لأي مستخدم يحمل دور admin بتنفيذ أي عملية (إدخال، تحديث، حذف) على أي سجل
CREATE POLICY "admin_absolute_control" ON public.profiles
FOR ALL 
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 3. ضمان أن المدير يمكنه حذف الطلاب المرتبطين بالمعلم أو ولي الأمر لتسهيل عملية الحذف الكامل
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_delete_students" ON public.students;
CREATE POLICY "admin_delete_students" ON public.students
FOR DELETE TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 4. تحديث وظيفة التحقق من المدير لتكون أكثر أماناً
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (raw_user_meta_data ->> 'role') = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إعادة منح الصلاحيات الأساسية للمخطط العام
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
