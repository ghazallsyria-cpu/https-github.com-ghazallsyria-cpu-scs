
-- ==========================================
-- 1. إصلاح وتوحيد أسماء الأعمدة
-- ==========================================

DO $$ 
BEGIN
  -- إذا كان العمود موجوداً بالاسم القديم، قم بتغييره
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='agreed_payment') THEN
    ALTER TABLE public.students RENAME COLUMN agreed_payment TO agreed_amount;
  END IF;

  -- التأكد من وجود العمود بالاسم الصحيح وإضافة قيمة افتراضية
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='agreed_amount') THEN
    ALTER TABLE public.students ALTER COLUMN agreed_amount SET DEFAULT 0;
    ALTER TABLE public.students ALTER COLUMN agreed_amount SET NOT NULL;
  END IF;
END $$;

-- ==========================================
-- 2. تنظيف السياسات القديمة
-- ==========================================
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'students', 'lessons', 'payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ==========================================
-- 3. إعداد العلاقات الصريحة (Foreign Keys)
-- ==========================================

-- ربط الطلاب بالمعلمين
ALTER TABLE IF EXISTS public.students
DROP CONSTRAINT IF EXISTS students_teacher_id_fkey,
ADD CONSTRAINT students_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- ربط الدروس
ALTER TABLE IF EXISTS public.lessons
DROP CONSTRAINT IF EXISTS lessons_teacher_id_fkey,
ADD CONSTRAINT lessons_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
DROP CONSTRAINT IF EXISTS lessons_student_id_fkey,
ADD CONSTRAINT lessons_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- ربط المدفوعات
ALTER TABLE IF EXISTS public.payments
DROP CONSTRAINT IF EXISTS payments_teacher_id_fkey,
ADD CONSTRAINT payments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
DROP CONSTRAINT IF EXISTS payments_student_id_fkey,
ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- ==========================================
-- 4. وظيفة الأمان والسياسات (RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.check_is_admin() 
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "p_profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "p_profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "p_profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.check_is_admin());
CREATE POLICY "p_profiles_delete" ON public.profiles FOR DELETE USING (public.check_is_admin());

CREATE POLICY "p_students_all" ON public.students FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());
CREATE POLICY "p_lessons_all" ON public.lessons FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());
CREATE POLICY "p_payments_all" ON public.payments FOR ALL USING (auth.uid() = teacher_id OR public.check_is_admin());

-- ترقية المدير
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
