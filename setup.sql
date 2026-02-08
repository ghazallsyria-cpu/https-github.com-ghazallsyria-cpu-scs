
-- حذف الـ View القديم لتجنب تعارض الأعمدة
DROP VIEW IF EXISTS public.student_summary_view CASCADE;

-- بناء الـ View الشامل بجميع الأعمدة المطلوبة للتقارير والرقابة
CREATE VIEW public.student_summary_view AS
SELECT 
    s.*,
    p.full_name as teacher_name,
    p.subjects as teacher_subjects,
    COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) as total_lessons,
    COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0) as total_paid,
    CASE 
        WHEN s.is_hourly THEN 
            (COALESCE((SELECT SUM(l.hours) FROM public.lessons l WHERE l.student_id = s.id), 0) * s.price_per_hour) - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
        ELSE 
            s.agreed_amount - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.student_id = s.id), 0)
    END as remaining_balance
FROM public.students s
LEFT JOIN public.profiles p ON s.teacher_id = p.id;

-- تفعيل صلاحيات القراءة الشاملة للمدير
DROP POLICY IF EXISTS "admin_select_all_lessons" ON public.lessons;
CREATE POLICY "admin_select_all_lessons" ON public.lessons FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR teacher_id = auth.uid());

DROP POLICY IF EXISTS "admin_select_all_payments" ON public.payments;
CREATE POLICY "admin_select_all_payments" ON public.payments FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR teacher_id = auth.uid());

DROP POLICY IF EXISTS "admin_select_all_students" ON public.students;
CREATE POLICY "admin_select_all_students" ON public.students FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR teacher_id = auth.uid());

DROP POLICY IF EXISTS "admin_view_all_profiles" ON public.profiles;
CREATE POLICY "admin_view_all_profiles" ON public.profiles FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR id = auth.uid());
