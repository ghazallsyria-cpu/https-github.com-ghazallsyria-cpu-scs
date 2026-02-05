-- [V7] الإصلاح الجذري النهائي لصلاحيات مدير النظام
-- هذا الكود يكسر حلقة التكرار اللانهائي في RLS

-- 1. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. دالة التحقق من صلاحيات المدير (SECURITY DEFINER لكسر حلقة RLS)
-- الدالة تقرأ الجدول بصلاحيات الأدمن (bypass RLS) لتعود بالنتيجة الصحيحة
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. تفعيل سياسات الأمان RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. إعادة ضبط سياسات جدول البروفايل (الجزء الحاسم)
DROP POLICY IF EXISTS "Allow individual read" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin managed" ON public.profiles;
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;

-- سياسة تسمح للمستخدم بقراءة بياناته الخاصة
CREATE POLICY "Allow individual read" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- سياسة تسمح للمدير بالتحكم الكامل في كل شيء
CREATE POLICY "Allow admin managed" ON public.profiles 
FOR ALL USING (public.is_admin_check(auth.uid()));

-- 5. إعداد بقية الجداول والسياسات
-- الطلاب
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phones JSONB,
    school_name TEXT,
    grade TEXT,
    agreed_amount NUMERIC DEFAULT 0,
    is_hourly BOOLEAN DEFAULT false,
    price_per_hour NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students access" ON public.students;
CREATE POLICY "Students access" ON public.students FOR ALL
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

-- الأكواد
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Codes access" ON public.activation_codes;
CREATE POLICY "Codes access" ON public.activation_codes FOR ALL
USING (public.is_admin_check(auth.uid()));

-- عرض ملخص الطلاب (View)
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(l.total_lessons, 0) AS total_lessons,
    COALESCE(l.total_hours, 0) AS total_hours,
    COALESCE(p.total_paid, 0) AS total_paid,
    CASE 
        WHEN s.is_hourly THEN (COALESCE(l.total_hours, 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END AS expected_income,
    (CASE 
        WHEN s.is_hourly THEN (COALESCE(l.total_hours, 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END) - COALESCE(p.total_paid, 0) AS remaining_balance
FROM public.students s
LEFT JOIN (SELECT student_id, COUNT(*) AS total_lessons, SUM(hours) AS total_hours FROM public.lessons GROUP BY student_id) l ON s.id = l.student_id
LEFT JOIN (SELECT student_id, SUM(amount) AS total_paid FROM public.payments GROUP BY student_id) p ON s.id = p.student_id;

-- 6. ترقية حسابك الحالي إلى مدير فوراً
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE phone = '55315661';