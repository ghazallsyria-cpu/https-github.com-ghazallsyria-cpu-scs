
-- 1. التأكد من هيكلة جدول الملفات الشخصية
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
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'teacher' THEN false 
      ELSE true 
    END,
    COALESCE(new.raw_user_meta_data->>'subjects', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إنشاء المُشغل (Trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. تفعيل RLS وتحديث السياسات
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين برؤية ملفاتهم الشخصية
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث بياناتهم (مثل كلمة المرور أو الهاتف)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- صلاحيات المدير الكاملة على كل الملفات
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- سياسات الجداول الأخرى لضمان عدم حدوث أخطاء "Permission Denied"
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Student Management" ON public.students;
CREATE POLICY "Global Student Management" ON public.students FOR ALL USING (
    teacher_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Requests Access" ON public.tutor_requests;
CREATE POLICY "Global Requests Access" ON public.tutor_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    student_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
);
