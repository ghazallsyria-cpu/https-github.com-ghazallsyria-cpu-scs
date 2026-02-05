import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, Terminal, ChevronLeft } from 'lucide-react';

const sqlCode = `-- 1. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phones JSONB,
    school_name TEXT,
    grade TEXT,
    agreed_amount NUMERIC DEFAULT 0,
    is_hourly BOOLEAN DEFAULT false,
    price_per_hour NUMERIC DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    hours NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    payment_number TEXT,
    is_final BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    status_notes TEXT,
    weaknesses TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. [الإصلاح النهائي V6] دالة محصنة للتحقق من صلاحيات المدير، مصممة خصيصاً لبيئة Supabase.
-- هذا الحل يتجنب الحاجة لخاصية LEAKPROOF (التي تتطلب صلاحيات خارقة)، وبدلاً من ذلك
-- يستخدم تقنية 'session_replication_role' لتعطيل سياسات الأمان بشكل مؤقت وآمن أثناء تنفيذ الدالة،
-- مما يكسر الحلقة المفرغة بشكل نهائي وموثوق ضمن الصلاحيات المتاحة.
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path to prevent any potential hijacking.
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Temporarily bypass RLS for this specific query by changing the role.
  SET LOCAL session_replication_role = 'replica';
  
  is_admin_user := EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
  
  -- Revert to the original role to re-enable RLS for subsequent operations.
  SET LOCAL session_replication_role = 'origin';

  RETURN is_admin_user;
END;
$$;


-- 3. وظيفة تفعيل الحساب برمجياً
CREATE OR REPLACE FUNCTION public.activate_account_with_code(provided_code TEXT)
RETURNS JSON AS $$
DECLARE
    target_code_id UUID;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    
    SELECT id INTO target_code_id FROM public.activation_codes 
    WHERE code = UPPER(provided_code) AND is_used = false LIMIT 1;

    IF target_code_id IS NOT NULL THEN
        UPDATE public.activation_codes SET is_used = true, used_by = user_id WHERE id = target_code_id;
        UPDATE public.profiles SET is_approved = true WHERE id = user_id;
        RETURN json_build_object('success', true, 'message', 'تم التفعيل بنجاح');
    ELSE
        RETURN json_build_object('success', false, 'message', 'كود التفعيل غير صحيح أو مستخدم مسبقاً');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إنشاء View لتسهيل جلب بيانات الطلاب المجمعة
CREATE OR REPLACE VIEW public.student_summary_view AS
SELECT 
    s.id, s.teacher_id, s.name, s.address, s.phones, s.school_name, s.grade,
    s.agreed_amount, s.is_hourly, s.price_per_hour, s.is_completed,
    s.academic_year, s.semester, s.created_at,
    COALESCE(l.total_lessons, 0) AS total_lessons,
    COALESCE(l.total_hours, 0) AS total_hours,
    COALESCE(p.total_paid, 0) AS total_paid,
    CASE 
        WHEN s.is_hourly THEN (COALESCE(l.total_hours, 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END AS expected_income,
    (CASE 
        WHEN s.is_hourly THEN (COALESCE(l.total_hours, 0) * s.price_per_hour)
        ELSE s.agreed_amount
    END) - COALESCE(p.total_paid, 0) AS remaining_balance
FROM public.students s
LEFT JOIN (SELECT student_id, COUNT(*) AS total_lessons, SUM(hours) AS total_hours FROM public.lessons GROUP BY student_id) l ON s.id = l.student_id
LEFT JOIN (SELECT student_id, SUM(amount) AS total_paid FROM public.payments GROUP BY student_id) p ON s.id = p.student_id;

-- 5. إعادة ضبط سياسات الأمان (RLS) - [الإصلاح النهائي V6]
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة لضمان عدم التعارض
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Students access" ON public.students;
DROP POLICY IF EXISTS "Lessons access" ON public.lessons;
DROP POLICY IF EXISTS "Payments access" ON public.payments;
DROP POLICY IF EXISTS "Schedules access" ON public.schedules;
DROP POLICY IF EXISTS "Academic records access" ON public.academic_records;
DROP POLICY IF EXISTS "Codes access" ON public.activation_codes;

-- إنشاء السياسات الجديدة والموثوقة باستخدام الدالة المساعدة
CREATE POLICY "Profiles access" ON public.profiles FOR ALL
USING (auth.uid() = id OR public.is_admin_check(auth.uid()));

CREATE POLICY "Students access" ON public.students FOR ALL
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

CREATE POLICY "Lessons access" ON public.lessons FOR ALL
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

CREATE POLICY "Payments access" ON public.payments FOR ALL
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

CREATE POLICY "Schedules access" ON public.schedules FOR ALL
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

CREATE POLICY "Academic records access" ON public.academic_records FOR ALL
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

CREATE POLICY "Codes access" ON public.activation_codes FOR ALL
USING (public.is_admin_check(auth.uid()));
`;

const DatabaseViewer = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-right font-['Cairo']">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100"><Database size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">نسخة قواعد البيانات</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">الكود الكامل لإعداد الجداول والوظائف</p>
          </div>
        </div>
        <Link to="/teachers" className="bg-white text-slate-500 font-black px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-sm">
          <ChevronLeft size={16} className="rotate-180" /> العودة للإدارة
        </Link>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-4 relative group">
        <button 
          onClick={handleCopy}
          className="absolute top-6 left-6 z-10 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-3 border border-white/20 transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
          disabled={copied}
        >
          {copied ? <><Check size={16} className="text-emerald-400" /> تم النسخ!</> : <><Copy size={16} /> نسخ الكود</>}
        </button>
        <pre className="w-full h-[60vh] overflow-auto text-left bg-transparent p-8 rounded-2xl text-emerald-300 font-mono text-xs no-scrollbar selection:bg-indigo-500 selection:text-white">
          <code>
            {sqlCode}
          </code>
        </pre>
      </div>

      <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[3rem] flex items-start gap-6">
        <div className="bg-amber-500/80 p-4 rounded-2xl text-white shadow-xl shadow-amber-100">
          <Terminal size={28} />
        </div>
        <div>
          <h4 className="font-black text-amber-900 text-lg mb-2">تعليمات هامة</h4>
          <p className="text-sm font-bold text-amber-700/80 leading-relaxed">
            هذا الكود مخصص للإعداد الأولي لقاعدة البيانات. يجب تشغيله <strong className="text-amber-900">مرة واحدة فقط</strong> عبر محرر SQL في لوحة تحكم Supabase الخاصة بمشروعك لضمان عمل النظام بشكل صحيح.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;