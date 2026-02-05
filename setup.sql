
-- 1. التأكد من وجود الأعمدة المطلوبة في الجداول
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_number TEXT DEFAULT 'الأولى';

-- 2. إعداد جدول الأكواد مع ضبط السياسات بشكل صارم وفعال
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- تفعيل الحماية
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- حذف كافة السياسات القديمة للبدء من جديد
DROP POLICY IF EXISTS "Admins manage codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Public select unused" ON public.activation_codes;

-- سياسة المدير: الوصول الكامل والشامل (FOR ALL)
-- نستخدم رقم الهاتف الثابت للمدير كمرجع أمان إضافي قوي
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

-- سياسة المستخدمين (المعلمين): التحقق فقط من وجود كود غير مستخدم (لأغراض التسجيل)
CREATE POLICY "Public select unused" ON public.activation_codes 
FOR SELECT USING (is_used = false);

-- 3. التأكد من أن حساب المدير يمتلك رتبة admin دائماً
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';

-- 4. تحديث جدول المتابعة الدراسية
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

CREATE POLICY "Teachers records access" ON public.academic_records
FOR ALL USING (
    auth.uid() = teacher_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR phone = '55315661'))
);

-- تحديث الكاش لضمان تفعيل التغييرات فوراً
NOTIFY pgrst, 'reload schema';
