-- [V8] النظام المتكامل لإدارة القمة - إعداد الجداول والصلاحيات
-- هذا الملف يحتوي على كافة الجداول اللازمة لعمل التطبيق بشكل صحيح

-- 1. جدول الحسابات الشخصية (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- دالة التحقق من صلاحيات المدير (Security Definer لكسر حلقة RLS)
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles individual read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles admin managed" ON public.profiles;
CREATE POLICY "Profiles individual read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles admin managed" ON public.profiles FOR ALL USING (public.is_admin_check(auth.uid()));

-- 2. جدول الطلاب (Students)
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

-- 3. جدول سجل الحصص (Lessons)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours NUMERIC NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lessons access" ON public.lessons;
CREATE POLICY "Lessons access" ON public.lessons FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

-- 4. جدول المدفوعات (Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'كاش',
    payment_number TEXT DEFAULT 'الأولى',
    is_final BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments access" ON public.payments;
CREATE POLICY "Payments access" ON public.payments FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

-- 5. جدول المتابعة الدراسية (Academic Records) - هذا ما سألت عنه
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_notes TEXT, -- ملاحظات الحالة العامة
    weaknesses TEXT,    -- نقاط الضعف
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Academic records access" ON public.academic_records;
CREATE POLICY "Academic records access" ON public.academic_records FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

-- 6. جدول المواعيد الأسبوعية (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Schedules access" ON public.schedules;
CREATE POLICY "Schedules access" ON public.schedules FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

-- 7. جدول أكواد التفعيل (Activation Codes)
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Codes admin access" ON public.activation_codes;
CREATE POLICY "Codes admin access" ON public.activation_codes FOR ALL 
USING (public.is_admin_check(auth.uid()));

-- 8. عرض ملخص بيانات الطالب (Student Summary View)
-- يفضل حذف العرض القديم وإعادة إنشائه لضمان تحديث الجداول المرتبطة
DROP VIEW IF EXISTS public.student_summary_view;
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
LEFT JOIN (
    SELECT student_id, COUNT(*) AS total_lessons, SUM(hours) AS total_hours 
    FROM public.lessons 
    GROUP BY student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT student_id, SUM(amount) AS total_paid 
    FROM public.payments 
    GROUP BY student_id
) p ON s.id = p.student_id;

-- 9. ترقية حساب المدير
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE phone = '55315661';