
-- إضافة حقول جديدة لجدول الطلاب
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;

-- إضافة حقول جديدة لجدول المدفوعات
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'كاش',
ADD COLUMN IF NOT EXISTS payment_number TEXT,
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT false;

-- إنشاء جدول السجلات الدراسية (الملاحظات ونقاط الضعف)
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_notes TEXT,
    weaknesses TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل الحماية للسجل الدراسي
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own academic records" ON public.academic_records FOR ALL USING (auth.uid() = teacher_id);

-- حذف الـ View القديم لتجنب أخطاء تغيير هيكلية الأعمدة (Metadata Conflict)
DROP VIEW IF EXISTS public.student_summary_view;

-- إعادة إنشاء الـ View بالهيكلية الجديدة
CREATE VIEW public.student_summary_view AS
SELECT 
    s.*,
    COALESCE(l.total_lessons, 0) as total_lessons,
    COALESCE(l.total_hours, 0) as total_hours,
    COALESCE(p.total_paid, 0) as total_paid,
    CASE 
        WHEN s.is_hourly THEN COALESCE(l.total_hours, 0) * s.price_per_hour
        ELSE s.agreed_amount
    END as expected_income,
    (CASE 
        WHEN s.is_hourly THEN COALESCE(l.total_hours, 0) * s.price_per_hour
        ELSE s.agreed_amount
    END) - COALESCE(p.total_paid, 0) as remaining_balance
FROM students s
LEFT JOIN (
    SELECT student_id, COUNT(*) as total_lessons, SUM(hours) as total_hours
    FROM lessons
    GROUP BY student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT student_id, SUM(amount) as total_paid
    FROM payments
    GROUP BY student_id
) p ON s.id = p.student_id;
