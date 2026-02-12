
-- 1. التأكد من وجود الجداول (بدون حذف البيانات)
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

-- 2. تفعيل RLS لجميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 3. سياسة جدول الملفات الشخصية (الحل النهائي للـ Recursion)
-- نستخدم auth.uid() للمستخدم العادي و JWT للمدير دون أي استعلام داخلي
DROP POLICY IF EXISTS "Profiles Access Policy" ON public.profiles;
CREATE POLICY "Profiles Access Policy" ON public.profiles 
FOR ALL TO authenticated 
USING (
  id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 4. سياسة جدول الطلاب (Students) - فتح صلاحيات CRUD الكاملة
DROP POLICY IF EXISTS "Students Full Management" ON public.students;
CREATE POLICY "Students Full Management" ON public.students 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 5. سياسة جدول الحصص (Lessons)
DROP POLICY IF EXISTS "Lessons Full Management" ON public.lessons;
CREATE POLICY "Lessons Full Management" ON public.lessons 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 6. سياسة جدول الدفعات (Payments)
DROP POLICY IF EXISTS "Payments Full Management" ON public.payments;
CREATE POLICY "Payments Full Management" ON public.payments 
FOR ALL TO authenticated 
USING (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  teacher_id = auth.uid() 
  OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 7. منح كافة الصلاحيات للمستخدمين المسجلين لضمان تنفيذ العمليات الجماعية
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
