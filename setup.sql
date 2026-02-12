
-- 1. التأكد من جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'student',
    is_approved BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    subjects TEXT,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. تفعيل RLS على كافة الجداول الحساسة
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 3. سياسات جدول الملفات الشخصية (Profiles)
DROP POLICY IF EXISTS "Profiles Access" ON public.profiles;
CREATE POLICY "Profiles Access" ON public.profiles FOR ALL USING (
    auth.uid() = id OR 
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
);

-- 4. سياسات جدول الطلاب (Students) - الصلاحيات الكاملة للمالك والمدير
DROP POLICY IF EXISTS "Students Management" ON public.students;
CREATE POLICY "Students Management" ON public.students FOR ALL USING (
    teacher_id = auth.uid() OR 
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
);

-- 5. سياسات جدول الحصص (Lessons)
DROP POLICY IF EXISTS "Lessons Management" ON public.lessons;
CREATE POLICY "Lessons Management" ON public.lessons FOR ALL USING (
    teacher_id = auth.uid() OR 
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
);

-- 6. سياسات جدول الدفعات (Payments)
DROP POLICY IF EXISTS "Payments Management" ON public.payments;
CREATE POLICY "Payments Management" ON public.payments FOR ALL USING (
    teacher_id = auth.uid() OR 
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
);

-- 7. سياسات الجداول الأسبوعية (Schedules)
DROP POLICY IF EXISTS "Schedules Management" ON public.schedules;
CREATE POLICY "Schedules Management" ON public.schedules FOR ALL USING (
    teacher_id = auth.uid() OR 
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
);

-- 8. سياسات طلبات البحث (Tutor Requests)
DROP POLICY IF EXISTS "Requests Management" ON public.tutor_requests;
CREATE POLICY "Requests Management" ON public.tutor_requests FOR ALL USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin' OR
    student_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
);

-- 9. منح صلاحيات الاستخدام المباشر لـ Authenticated User لضمان عمل CRUD
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
