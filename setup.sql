
-- تفعيل سياسات الحذف الشاملة للمدير فقط على كافة الجداول
-- 1. جدول الدروس
DROP POLICY IF EXISTS "admin_delete_lessons" ON public.lessons;
CREATE POLICY "admin_delete_lessons" ON public.lessons FOR DELETE TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 2. جدول المدفوعات
DROP POLICY IF EXISTS "admin_delete_payments" ON public.payments;
CREATE POLICY "admin_delete_payments" ON public.payments FOR DELETE TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 3. جدول الجداول الدراسية
DROP POLICY IF EXISTS "admin_delete_schedules" ON public.schedules;
CREATE POLICY "admin_delete_schedules" ON public.schedules FOR DELETE TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 4. تعزيز سياسة السلطة المطلقة على البروفايلات
DROP POLICY IF EXISTS "admin_absolute_control" ON public.profiles;
CREATE POLICY "admin_absolute_control" ON public.profiles
FOR ALL TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 5. منح صلاحية الحذف للمدير على الطلاب (تم تحديثها للتأكيد)
DROP POLICY IF EXISTS "admin_delete_students" ON public.students;
CREATE POLICY "admin_delete_students" ON public.students FOR DELETE TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
