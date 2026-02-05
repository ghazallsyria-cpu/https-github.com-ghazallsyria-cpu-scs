
-- 1. التأكد من ربط الأكواد بجدول البروفايلات (public.profiles) لسهولة الجلب
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- الربط مع البروفايلات وليس Auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. تفعيل RLS وإعادة ضبط السياسات
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Public select unused" ON public.activation_codes;

-- سياسة المدير: سماح كامل (باستخدام رقم الهاتف والـ ID)
CREATE POLICY "Admins manage codes" ON public.activation_codes 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.phone = '55315661')
    )
);

-- سياسة عامة: المعلمين يمكنهم رؤية الأكواد للتحقق منها فقط
CREATE POLICY "Public select unused" ON public.activation_codes 
FOR SELECT USING (true); -- السماح بالعرض للكل لحل مشكلة الاختفاء، التقييد سيكون برمجياً

-- 3. ضمان رتبة المدير
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';

-- 4. إصلاح جدول المتابعة
ALTER TABLE public.academic_records DROP CONSTRAINT IF EXISTS academic_records_student_id_fkey;
ALTER TABLE public.academic_records ADD CONSTRAINT academic_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- تحديث الكاش
NOTIFY pgrst, 'reload schema';
