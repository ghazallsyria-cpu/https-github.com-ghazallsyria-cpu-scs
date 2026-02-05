
-- 1. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. وظيفة للتحقق من كون المستخدم مديراً (لتجنب التكرار في RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. وظيفة تفعيل الحساب برمجياً
CREATE OR REPLACE FUNCTION public.activate_account_with_code(provided_code TEXT)
RETURNS JSON AS $$
DECLARE
    target_code_id UUID;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    
    SELECT id INTO target_code_id FROM public.activation_codes 
    WHERE code = UPPER(provided_code) AND is_used = false LIMIT 1;

    IF target_code_id IS NOT NULL THEN
        UPDATE public.activation_codes SET is_used = true, used_by = user_id WHERE id = target_code_id;
        UPDATE public.profiles SET is_approved = true WHERE id = user_id;
        RETURN json_build_object('success', true, 'message', 'تم التفعيل بنجاح');
    ELSE
        RETURN json_build_object('success', false, 'message', 'كود التفعيل غير صحيح أو مستخدم مسبقاً');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إعادة ضبط سياسات الأمان (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- سياسات البروفايل
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
CREATE POLICY "Profiles access" ON public.profiles FOR ALL 
USING (auth.uid() = id OR public.is_admin());

-- سياسات الطلاب
DROP POLICY IF EXISTS "Students access" ON public.students;
CREATE POLICY "Students access" ON public.students FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin());

-- سياسات الحصص
DROP POLICY IF EXISTS "Lessons access" ON public.lessons;
CREATE POLICY "Lessons access" ON public.lessons FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin());

-- سياسات المدفوعات (تسمح للمعلم بالتعديل)
DROP POLICY IF EXISTS "Payments access" ON public.payments;
CREATE POLICY "Payments access" ON public.payments FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin());

-- سياسات أكواد التفعيل
DROP POLICY IF EXISTS "Codes access" ON public.activation_codes;
CREATE POLICY "Codes access" ON public.activation_codes FOR ALL 
USING (public.is_admin());
