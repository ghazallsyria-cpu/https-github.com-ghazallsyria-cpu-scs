
-- 1. إضافة جدول أكواد التفعيل إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. وظيفة تفعيل الحساب برمجياً (تُستدعى من التطبيق)
CREATE OR REPLACE FUNCTION public.activate_account_with_code(provided_code TEXT)
RETURNS JSON AS $$
DECLARE
    target_code_id UUID;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    
    -- البحث عن كود صالح وغير مستخدم
    SELECT id INTO target_code_id FROM public.activation_codes 
    WHERE code = provided_code AND is_used = false LIMIT 1;

    IF target_code_id IS NOT NULL THEN
        -- تحديث الكود ليصبح مستخدماً
        UPDATE public.activation_codes SET is_used = true, used_by = user_id WHERE id = target_code_id;
        -- تحديث ملف المستخدم ليصبح مفعلاً بشكل دائم
        UPDATE public.profiles SET is_approved = true WHERE id = user_id;
        
        RETURN json_build_object('success', true, 'message', 'تم التفعيل بنجاح');
    ELSE
        RETURN json_build_object('success', false, 'message', 'كود التفعيل غير صحيح أو مستخدم مسبقاً');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تفعيل RLS وتعزيز صلاحيات المدير (Admin)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- سياسة الوصول للملفات الشخصية: الكل يرى نفسه، والمدير يرى الكل
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
CREATE POLICY "Profiles access" ON public.profiles FOR ALL 
USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- سياسة الوصول للطلاب: المعلم لطلابه والمدير للجميع
DROP POLICY IF EXISTS "Students access" ON public.students;
CREATE POLICY "Students access" ON public.students FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- سياسة الوصول للمدفوعات: السماح للمعلم بالتعديل (Update) والمدير للكل
DROP POLICY IF EXISTS "Payments access" ON public.payments;
CREATE POLICY "Payments access" ON public.payments FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- سياسة الوصول للدروس
DROP POLICY IF EXISTS "Lessons access" ON public.lessons;
CREATE POLICY "Lessons access" ON public.lessons FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
