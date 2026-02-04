
-- ==========================================
-- 1. الجداول الأساسية (Core Tables)
-- ==========================================

-- جدول البروفايلات (المعلمين والمدراء)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'teacher', -- 'admin' or 'teacher'
    phone TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    grade TEXT,
    agreed_amount NUMERIC DEFAULT 0,
    is_hourly BOOLEAN DEFAULT false,
    price_per_hour NUMERIC DEFAULT 0,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الدروس (الحصص)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    hours NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول أكواد التفعيل
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    used_by UUID REFERENCES public.profiles(id),
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. الواجهات المحسنة للأداء (Performance Views)
-- ==========================================

-- واجهة ملخص الطلاب المالية والدرسية
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.*,
    p.full_name as teacher_name,
    COALESCE(l.total_hours, 0) as total_hours,
    COALESCE(l.lesson_count, 0) as total_lessons,
    COALESCE(pm.total_paid, 0) as total_paid,
    CASE 
        WHEN s.is_hourly THEN COALESCE(l.total_hours, 0) * s.price_per_hour
        ELSE s.agreed_amount
    END as expected_income,
    (CASE 
        WHEN s.is_hourly THEN COALESCE(l.total_hours, 0) * s.price_per_hour
        ELSE s.agreed_amount
    END) - COALESCE(pm.total_paid, 0) as remaining_balance
FROM 
    public.students s
LEFT JOIN 
    public.profiles p ON s.teacher_id = p.id
LEFT JOIN (
    SELECT student_id, SUM(hours) as total_hours, COUNT(id) as lesson_count
    FROM public.lessons
    GROUP BY student_id
) l ON s.id = l.student_id
LEFT JOIN (
    SELECT student_id, SUM(amount) as total_paid
    FROM public.payments
    GROUP BY student_id
) pm ON s.id = pm.student_id;

-- ==========================================
-- 3. وظائف النظام (System Functions / RPCs)
-- ==========================================

-- أ) وظيفة تفعيل الحساب عبر الكود
CREATE OR REPLACE FUNCTION public.activate_account_with_code(provided_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uid UUID;
    v_code_id UUID;
BEGIN
    v_uid := auth.uid();
    
    -- التحقق من الكود
    SELECT id INTO v_code_id 
    FROM public.activation_codes 
    WHERE code = provided_code AND is_used = false;

    IF v_code_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'كود التفعيل غير صحيح أو تم استخدامه مسبقاً');
    END IF;

    -- تفعيل الحساب
    UPDATE public.profiles SET is_approved = true WHERE id = v_uid;
    
    -- تحديث الكود
    UPDATE public.activation_codes SET 
        is_used = true, 
        used_by = v_uid 
    WHERE id = v_code_id;

    RETURN json_build_object('success', true, 'message', 'تم تفعيل حسابك بنجاح');
END;
$$;

-- ب) وظيفة نقل أو نسخ الطلاب
CREATE OR REPLACE FUNCTION public.handle_student_transfer(
    source_student_id UUID,
    target_year TEXT,
    target_semester TEXT,
    include_data BOOLEAN,
    is_move BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_student_id UUID;
    v_teacher_id UUID;
    v_name TEXT;
    v_address TEXT;
    v_phone TEXT;
    v_grade TEXT;
    v_agreed_amount NUMERIC;
    v_is_hourly BOOLEAN;
    v_price_per_hour NUMERIC;
BEGIN
    SELECT teacher_id, name, address, phone, grade, agreed_amount, is_hourly, price_per_hour
    INTO v_teacher_id, v_name, v_address, v_phone, v_grade, v_agreed_amount, v_is_hourly, v_price_per_hour
    FROM public.students
    WHERE id = source_student_id;

    INSERT INTO public.students (
        teacher_id, name, address, phone, grade, 
        agreed_amount, is_hourly, price_per_hour, 
        academic_year, semester
    ) VALUES (
        v_teacher_id, v_name, v_address, v_phone, v_grade, 
        v_agreed_amount, v_is_hourly, v_price_per_hour, 
        target_year, target_semester
    ) RETURNING id INTO new_student_id;

    IF include_data THEN
        INSERT INTO public.lessons (teacher_id, student_id, lesson_date, hours, notes)
        SELECT teacher_id, new_student_id, lesson_date, hours, notes
        FROM public.lessons WHERE student_id = source_student_id;

        INSERT INTO public.payments (teacher_id, student_id, amount, payment_date, notes)
        SELECT teacher_id, new_student_id, amount, payment_date, notes
        FROM public.payments WHERE student_id = source_student_id;
    END IF;

    IF is_move THEN
        DELETE FROM public.students WHERE id = source_student_id;
    END IF;

    RETURN json_build_object('success', true, 'message', 'تمت العملية بنجاح');
END;
$$;

-- ج) وظيفة التحقق من الرتبة
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- ==========================================
-- 4. الفهارس (Indexes) لسرعة البحث
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_students_year_semester ON public.students (academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_lessons_student ON public.lessons (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
