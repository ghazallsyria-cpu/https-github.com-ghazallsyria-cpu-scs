
-- 1. التأكد من هيكلة الجدول الأساسي
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

-- 2. تفعيل الحماية RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 3. سياسات جدول الملفات الشخصية (الاعتماد الكلي على JWT لمنع الـ Recursion)
-- القاعدة الذهبية: لا تستعلم من جدول profiles داخل سياسة جدول profiles
DROP POLICY IF EXISTS "Profiles Access Policy" ON public.profiles;
CREATE POLICY "Profiles Access Policy" ON public.profiles 
FOR ALL TO authenticated 
USING (
  id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 4. سياسات جدول الطلاب (Students) - صلاحيات كاملة CRUD
DROP POLICY IF EXISTS "Students Full Management" ON public.students;
CREATE POLICY "Students Full Management" ON public.students 
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
DROP POLICY IF EXISTS "Lessons Full Management" ON public.lessons;
CREATE POLICY "Lessons Full Management" ON public.lessons 
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
DROP POLICY IF EXISTS "Payments Full Management" ON public.payments;
CREATE POLICY "Payments Full Management" ON public.payments 
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
DROP POLICY IF EXISTS "Schedules Full Management" ON public.schedules;
CREATE POLICY "Schedules Full Management" ON public.schedules 
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
DROP POLICY IF EXISTS "Requests Full Management" ON public.tutor_requests;
CREATE POLICY "Requests Full Management" ON public.tutor_requests 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
  student_phone = (auth.jwt() -> 'user_metadata' ->> 'phone')
);

-- 9. منح صلاحيات الاستخدام الشاملة لـ Authenticated (لا بد منها للعمليات الجماعية)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
