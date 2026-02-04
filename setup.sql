
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

-- 2. جدول الطلاب (Students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    school_name TEXT,
    grade TEXT NOT NULL,
    phones JSONB DEFAULT '[]'::jsonb,
    agreed_amount NUMERIC DEFAULT 0,
    is_hourly BOOLEAN DEFAULT false,
    price_per_hour NUMERIC DEFAULT 0,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الحصص (Lessons)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_date DATE DEFAULT CURRENT_DATE,
    hours NUMERIC DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول المدفوعات (Payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'كاش',
    payment_number TEXT DEFAULT 'الأولى',
    is_final BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول الجدول الزمني (Schedules)
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

-- 6. تفعيل RLS لجميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 7. سياسات الوصول (Policies)

-- سياسة الملفات الشخصية
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (true);

-- سياسة الطلاب: المعلم يرى ويدير طلابه، والمدير يرى الجميع
DROP POLICY IF EXISTS "Students teacher access" ON public.students;
CREATE POLICY "Students teacher access" ON public.students FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- سياسة الحصص
DROP POLICY IF EXISTS "Lessons teacher access" ON public.lessons;
CREATE POLICY "Lessons teacher access" ON public.lessons FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- سياسة المدفوعات
DROP POLICY IF EXISTS "Payments teacher access" ON public.payments;
CREATE POLICY "Payments teacher access" ON public.payments FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- سياسة الجدول الزمني
DROP POLICY IF EXISTS "Schedules teacher access" ON public.schedules;
CREATE POLICY "Schedules teacher access" ON public.schedules FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (auth.uid() = teacher_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 8. إعادة بناء الـ View للملخص الطلابي ليكون متوافقاً مع الهيكلة الجديدة
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
FROM public.students s
LEFT JOIN (
    SELECT student_id, COUNT(*) as total_lessons, SUM(hours) as total_hours
    FROM public.lessons GROUP BY student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT student_id, SUM(amount) as total_paid
    FROM public.payments GROUP BY student_id
) p ON s.id = p.student_id;
