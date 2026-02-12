
-- 1. التأكد من هيكلة الجدول
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

-- 2. تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 3. سياسات جدول الملفات الشخصية (تجنب الـ Recursion باستخدام JWT)
DROP POLICY IF EXISTS "Profiles Self Access" ON public.profiles;
CREATE POLICY "Profiles Self Access" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin Global Access Profiles" ON public.profiles;
CREATE POLICY "Admin Global Access Profiles" ON public.profiles FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 4. سياسات جدول الطلاب (Students) - فتح الصلاحيات الكاملة
DROP POLICY IF EXISTS "Teacher Student Management" ON public.students;
CREATE POLICY "Teacher Student Management" ON public.students 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 5. سياسات جدول الحصص (Lessons)
DROP POLICY IF EXISTS "Teacher Lesson Management" ON public.lessons;
CREATE POLICY "Teacher Lesson Management" ON public.lessons 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 6. سياسات جدول الدفعات (Payments)
DROP POLICY IF EXISTS "Teacher Payment Management" ON public.payments;
CREATE POLICY "Teacher Payment Management" ON public.payments 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 7. سياسات جدول الجدول الأسبوعي (Schedules)
DROP POLICY IF EXISTS "Teacher Schedule Management" ON public.schedules;
CREATE POLICY "Teacher Schedule Management" ON public.schedules 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 8. سياسات طلبات البحث
DROP POLICY IF EXISTS "Admin Request Management" ON public.tutor_requests;
CREATE POLICY "Admin Request Management" ON public.tutor_requests 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
  student_phone = (auth.jwt() -> 'user_metadata' ->> 'phone')
);

-- 9. منح الصلاحيات العامة (المنقذ النهائي لعمليات CRUD)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
