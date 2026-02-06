-- 1. حذف المشغلات القديمة لتجنب التعارض
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. التأكد من هيكلة جدول Profiles الصحيحة
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  role text DEFAULT 'teacher',
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. تفعيل RLS (أمان مستوى الصف)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. إضافة سياسات الوصول (Permissions)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. وظيفة معالجة المستخدمين الجدد (Trigger Function) مع معالجة الأخطاء
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN (new.raw_user_meta_data->>'phone') = '55315661' THEN 'admin' 
      ELSE 'teacher' 
    END,
    CASE 
      WHEN (new.raw_user_meta_data->>'phone') = '55315661' THEN true 
      ELSE false 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = CASE WHEN EXCLUDED.phone = '55315661' THEN 'admin' ELSE profiles.role END;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- في حالة الفشل، سجل الخطأ واستمر (لتجنب منع إنشاء حساب Auth)
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. إعادة ربط المشغل
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. التأكد من صلاحيات جدول Profiles لـ Auth
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;