
-- ==========================================
-- 1. وظيفة تفعيل الحساب باستخدام كود (Secure Activation Function)
-- ==========================================

CREATE OR REPLACE FUNCTION public.activate_account_with_code(provided_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- تشغيل الصلاحيات بصلاحية النظام لتجاوز RLS مؤقتاً
AS $$
DECLARE
    code_record RECORD;
    result JSONB;
BEGIN
    -- 1. البحث عن الكود والتأكد أنه غير مستخدم
    SELECT * INTO code_record 
    FROM public.activation_codes 
    WHERE code = provided_code AND is_used = false 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'كود التفعيل غير صحيح أو مستخدم مسبقاً');
    END IF;

    -- 2. تحديث بروفايل المعلم ليصبح معتمداً
    UPDATE public.profiles 
    SET is_approved = true 
    WHERE id = auth.uid();

    -- 3. تحديث الكود ليصبح مستخدماً
    UPDATE public.activation_codes 
    SET is_used = true, used_by = auth.uid() 
    WHERE id = code_record.id;

    RETURN jsonb_build_object('success', true, 'message', 'تم تفعيل حسابك بنجاح');
END;
$$;

-- ==========================================
-- 2. تصحيح السياسات الأمنية لضمان ظهور المعلمين للمدير
-- ==========================================

-- التأكد من أن المدير يمكنه رؤية جميع البروفايلات دائماً
DROP POLICY IF EXISTS "Profiles_Admin_All" ON public.profiles;
CREATE POLICY "Profiles_Admin_All" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- السماح للمستخدم بإنشاء بروفايله الخاص عند التسجيل (حتى لو لم يكن مسجلاً دخول بعد)
DROP POLICY IF EXISTS "Profiles_Owner_Insert" ON public.profiles;
CREATE POLICY "Profiles_Owner_Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- السماح للمستخدم بتحديث بياناته (لأغراض التفعيل مثلاً)
DROP POLICY IF EXISTS "Profiles_Owner_Update" ON public.profiles;
CREATE POLICY "Profiles_Owner_Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
