
-- جدول المواعيد الأسبوعية
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL, -- 'السبت', 'الأحد', إلخ
    start_time TIME NOT NULL,
    duration_hours NUMERIC DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس لتحسين سرعة الاستعلام
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_day ON public.schedules (teacher_id, day_of_week);

-- تفعيل سياسات الحماية (RLS)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own schedules" 
ON public.schedules FOR ALL 
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can see all schedules" 
ON public.schedules FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
