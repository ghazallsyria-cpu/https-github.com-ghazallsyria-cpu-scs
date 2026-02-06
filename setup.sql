-- 1. تنظيف المشغلات القديمة
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text UNIQUE,
  role text DEFAULT 'teacher',
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. تفعيل RLS على كافة الجداول (إذا لم تكن مفعلة)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. سياسات الوصول لجدول PROFILES (التحكم في المعلمين)
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
CREATE POLICY "Admin full access" ON public.profiles FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Self view/update" ON public.profiles;
CREATE POLICY "Self view/update" ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- 5. سياسات الوصول لجدول STUDENTS (التحكم في الطلاب)
DROP POLICY IF EXISTS "Admin full students access" ON public.students;
CREATE POLICY "Admin full students access" ON public.students FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Teachers own students" ON public.students;
CREATE POLICY "Teachers own students" ON public.students FOR ALL 
USING ( teacher_id = auth.uid() );

-- 6. سياسات الوصول لجدول PAYMENTS (التحكم المالي)
DROP POLICY IF EXISTS "Admin full payments access" ON public.payments;
CREATE POLICY "Admin full payments access" ON public.payments FOR ALL 
USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Teachers own payments" ON public.payments;
CREATE POLICY "Teachers own payments" ON public.payments FOR ALL 
USING ( teacher_id = auth.uid() );

-- 7. وظيفة معالجة المستخدمين الجدد المحسنة جداً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    is_admin_phone boolean;
BEGIN
    -- التحقق إذا كان الرقم هو رقم المدير
    is_admin_phone := (new.raw_user_meta_data->>'phone') = '55315661';

    INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      CASE WHEN is_admin_phone THEN 'admin' ELSE 'teacher' END,
      CASE WHEN is_admin_phone THEN true ELSE false END
    )
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      full_name = EXCLUDED.full_name,
      role = CASE WHEN is_admin_phone THEN 'admin' ELSE profiles.role END,
      is_approved = CASE WHEN is_admin_phone THEN true ELSE profiles.is_approved END;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- تجنب الفشل الكلي لعملية الـ Auth
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. إعادة ربط المشغل
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ترقية فورية لأي حساب موجود بهذا الرقم لمدير
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE phone = '55315661';