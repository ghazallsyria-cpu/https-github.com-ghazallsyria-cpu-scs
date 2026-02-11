
-- إضافة عمود حالة التوفر للملف الشخصي
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- إنشاء جدول طلبات الدروس الخصوصية
CREATE TABLE IF NOT EXISTS public.tutor_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    modality TEXT CHECK (modality IN ('home', 'online')),
    type TEXT CHECK (type IN ('course', 'single')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'rejected')),
    teacher_id UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- منح الصلاحيات
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to create requests" ON public.tutor_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin to manage requests" ON public.tutor_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow students to view their own" ON public.tutor_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND phone = student_phone)
);
