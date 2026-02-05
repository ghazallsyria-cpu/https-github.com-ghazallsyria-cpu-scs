
-- 1. إصلاح جدول المدفوعات (إضافة الأعمدة المفقودة)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_number TEXT DEFAULT 'الأولى';

-- 2. تأكيد إنشاء جدول الأكواد مع تصحيح السياسات
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- سياسة تسمح للمدير (بناءً على الهاتف أو الدور) بالتحكم الكامل
DROP POLICY IF EXISTS "Admins manage codes" ON public.activation_codes;
CREATE POLICY "Admins manage codes" ON public.activation_codes 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.phone = '55315661')
    )
);

DROP POLICY IF EXISTS "Public select unused" ON public.activation_codes;
CREATE POLICY "Public select unused" ON public.activation_codes 
FOR SELECT USING (is_used = false);

-- 3. تأكيد إنشاء جدول المتابعة الدراسية
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_notes TEXT NOT NULL,
    weaknesses TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

-- سياسة تسمح للمعلم برؤية وإضافة سجلاته
DROP POLICY IF EXISTS "Teachers records access" ON public.academic_records;
CREATE POLICY "Teachers records access" ON public.academic_records
FOR ALL USING (
    auth.uid() = teacher_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR phone = '55315661'))
);

-- 4. سياسات إضافية لجدول الطلاب لضمان قدرة المعلم الجديد على الإضافة فور تفعيله
DROP POLICY IF EXISTS "Teachers insert students" ON public.students;
CREATE POLICY "Teachers insert students" ON public.students 
FOR INSERT WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers view their students" ON public.students;
CREATE POLICY "Teachers view their students" ON public.students 
FOR SELECT USING (
    auth.uid() = teacher_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR phone = '55315661'))
);
