
-- 1. التأكد من هيكلة جدول الملفات الشخصية مع السماح للكل برؤية رتبهم
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

-- 2. وظيفة معالجة المستخدم الجديد (تُستدعى تلقائياً عند التسجيل)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved, subjects)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN true -- المدير مفعل دائماً
      WHEN (new.raw_user_meta_data->>'role') = 'teacher' THEN false 
      ELSE true 
    END,
    COALESCE(new.raw_user_meta_data->>'subjects', 'عام')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تفعيل RLS وتحديث السياسات بشكل "ماسي"
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الملفات الشخصية (ضروري لعرض أسماء المعلمين والطلاب)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);

-- السماح للمستخدمين بتحديث بياناتهم الخاصة
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- السماح بإضافة ملفات شخصية (للوظائف البرمجية)
DROP POLICY IF EXISTS "Enable insert for system" ON public.profiles;
CREATE POLICY "Enable insert for system" ON public.profiles FOR INSERT WITH CHECK (true);

-- صلاحيات المدير الشاملة
DROP POLICY IF EXISTS "Admins have full control" ON public.profiles;
CREATE POLICY "Admins have full control" ON public.profiles FOR ALL USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')) = 'admin'
    OR role = 'admin'
);
