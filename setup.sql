
-- 1. التأكد من وجود الأعمدة المطلوبة في جدول المدفوعات
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_number TEXT DEFAULT 'الأولى';

-- 2. إعداد جدول الأكواد وسياسات الأمان
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة لتجنب التعارض
DROP POLICY IF EXISTS "Admins manage codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Public select unused" ON public.activation_codes;

-- سياسة المدير: الوصول الكامل (عرض، إضافة، تعديل، حذف)
CREATE POLICY "Admins manage codes" ON public.activation_codes 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.phone = '55315661')
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.phone = '55315661')
    )
);

-- سياسة عامة: المعلمين يمكنهم فقط رؤية الأكواد غير المستخدمة للتحقق منها عند التسجيل
CREATE POLICY "Public select unused" ON public.activation_codes 
FOR SELECT USING (is_used = false);

-- 3. إعداد جدول المتابعة الدراسية وسياسات الأمان
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_notes TEXT NOT NULL,
    weaknesses TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers records access" ON public.academic_records;

-- سياسة المتابعة: المدير والمعلم صاحب الطالب يمكنهم الإدارة
CREATE POLICY "Teachers records access" ON public.academic_records
FOR ALL USING (
    auth.uid() = teacher_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR phone = '55315661'))
) WITH CHECK (
    auth.uid() = teacher_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR phone = '55315661'))
);

-- 4. تحديث الكاش البرمجي لـ Supabase (اختياري ولكن مفيد)
NOTIFY pgrst, 'reload schema';
