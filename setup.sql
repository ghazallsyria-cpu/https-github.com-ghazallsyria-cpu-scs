
-- 1. جدول الملفات الشخصية (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'teacher',
    gender TEXT DEFAULT 'male',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. تفعيل RLS للملفات الشخصية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. مُشغّل تلقائي لإنشاء بروفايل عند التسجيل (يحل مشكلة FK Constraint)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.email, -- نستخدم الإيميل مؤقتاً كمعرف هاتف إذا لم يوجد
    'teacher',
    false
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. جدول أكواد التفعيل (Activation Codes)
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. وظيفة تنشيط الحساب بالكود (RPC)
CREATE OR REPLACE FUNCTION public.activate_account_with_code(provided_code TEXT)
RETURNS JSON AS $$
DECLARE
    target_code_id UUID;
BEGIN
    -- البحث عن كود صالح وغير مستخدم
    SELECT id INTO target_code_id 
    FROM public.activation_codes 
    WHERE code = provided_code AND is_used = false 
    LIMIT 1;

    IF target_code_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'كود التفعيل غير صحيح أو تم استخدامه مسبقاً');
    END IF;

    -- تحديث الكود كـ مستخدم
    UPDATE public.activation_codes 
    SET is_used = true, used_by = auth.uid() 
    WHERE id = target_code_id;

    -- تفعيل حساب المستخدم
    UPDATE public.profiles 
    SET is_approved = true 
    WHERE id = auth.uid();

    RETURN json_build_object('success', true, 'message', 'تم تفعيل حسابك بنجاح');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. تحديث جدول الطلاب والمدفوعات (إضافة الحقول المفقودة)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'كاش';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT false;

-- 7. جدول السجلات الدراسية
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_notes TEXT,
    weaknesses TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. إعادة بناء الـ View للملخص الطلابي
DROP VIEW IF EXISTS public.student_summary_view;
CREATE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(l.total_lessons, 0) as total_lessons,
    COALESCE(l.total_hours, 0) as total_hours,
    COALESCE(p.total_paid, 0) as total_paid,
    CASE 
        WHEN s.is_hourly THEN COALESCE(l.total_hours, 0) * s.price_per_hour
        ELSE s.agreed_amount
    END as expected_income,
    (CASE 
        WHEN s.is_hourly THEN COALESCE(l.total_hours, 0) * s.price_per_hour
        ELSE s.agreed_amount
    END) - COALESCE(p.total_paid, 0) as remaining_balance
FROM students s
LEFT JOIN (
    SELECT student_id, COUNT(*) as total_lessons, SUM(hours) as total_hours
    FROM lessons GROUP BY student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT student_id, SUM(amount) as total_paid
    FROM payments GROUP BY student_id
) p ON s.id = p.student_id;
