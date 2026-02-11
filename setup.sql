
-- التأكد من تفعيل RLS على الجداول الأساسية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_requests ENABLE ROW LEVEL SECURITY;

-- 1. سياسات الملفات الشخصية (Profiles)
-- السماح لأي مستخدم جديد بإنشاء ملف تعريفي (ضروري عند التسجيل)
DROP POLICY IF EXISTS "Public can create profile" ON public.profiles;
CREATE POLICY "Public can create profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. سياسات الطلاب (Students)
-- السماح للمعلمين والمدراء بإدارة الطلاب
DROP POLICY IF EXISTS "Teachers can manage their own students" ON public.students;
CREATE POLICY "Teachers can manage their own students" ON public.students FOR ALL USING (
    teacher_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- السماح لأي مستخدم مسجل بإضافة سجل طالب (إصلاح مشكلة تسجيل الطلاب الجدد)
DROP POLICY IF EXISTS "Allow authenticated registration" ON public.students;
CREATE POLICY "Allow authenticated registration" ON public.students FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. سياسات طلبات المعلم (Tutor Requests)
DROP POLICY IF EXISTS "Anyone can create tutor requests" ON public.tutor_requests;
CREATE POLICY "Anyone can create tutor requests" ON public.tutor_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin and students can view requests" ON public.tutor_requests;
CREATE POLICY "Admin and students can view requests" ON public.tutor_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND phone = student_phone)
);
