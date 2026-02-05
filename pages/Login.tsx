import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, ShieldAlert, CheckCircle2, Phone, Lock, User, ArrowRight, Code2, Copy, Check, Terminal } from 'lucide-react';

const emergencySqlCode = `-- [V5] كود الإصلاح النهائي لصلاحيات المدير
-- 1. التأكد من وجود الجداول الأساسية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT, phone TEXT, role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false, gender TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, address TEXT, phones JSONB, school_name TEXT, grade TEXT, agreed_amount NUMERIC DEFAULT 0,
    is_hourly BOOLEAN DEFAULT false, price_per_hour NUMERIC DEFAULT 0, is_completed BOOLEAN DEFAULT false,
    academic_year TEXT NOT NULL, semester TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, lesson_date DATE NOT NULL, hours NUMERIC NOT NULL,
    notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, amount NUMERIC NOT NULL, payment_date DATE NOT NULL,
    payment_method TEXT, payment_number TEXT, is_final BOOLEAN DEFAULT false, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, day_of_week TEXT NOT NULL, start_time TIME NOT NULL,
    duration_hours NUMERIC NOT NULL, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, status_notes TEXT, weaknesses TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, code TEXT UNIQUE NOT NULL, is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. [الإصلاح النهائي V5] دالة محصنة للتحقق من صلاحيات المدير.
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SET search_path = public;
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER LEAKPROOF;
-- 3. تفعيل سياسات الأمان (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
-- 4. حذف السياسات القديمة
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Students access" ON public.students;
DROP POLICY IF EXISTS "Lessons access" ON public.lessons;
DROP POLICY IF EXISTS "Payments access" ON public.payments;
DROP POLICY IF EXISTS "Schedules access" ON public.schedules;
DROP POLICY IF EXISTS "Academic records access" ON public.academic_records;
DROP POLICY IF EXISTS "Codes access" ON public.activation_codes;
-- 5. إنشاء السياسات الجديدة والمحصنة
CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_admin_check(auth.uid()));
CREATE POLICY "Students access" ON public.students FOR ALL USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));
CREATE POLICY "Lessons access" ON public.lessons FOR ALL USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));
CREATE POLICY "Payments access" ON public.payments FOR ALL USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));
CREATE POLICY "Schedules access" ON public.schedules FOR ALL USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));
CREATE POLICY "Academic records access" ON public.academic_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));
CREATE POLICY "Codes access" ON public.activation_codes FOR ALL USING (public.is_admin_check(auth.uid()));
`;

const EmergencySqlViewer = ({ onHide }: { onHide: () => void }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(emergencySqlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-8 max-w-4xl w-full text-right font-['Cairo'] relative shadow-2xl border-4 border-rose-200">
                <button onClick={onHide} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-transform hover:rotate-90">&times;</button>
                <div className="flex items-center gap-4 mb-6">
                    <Terminal size={32} className="text-rose-500 bg-rose-50 p-3 rounded-2xl" />
                    <div>
                        <h2 className="text-xl font-black text-rose-600">منفذ الطوارئ: إصلاح صلاحيات المدير</h2>
                        <p className="text-xs text-slate-600 font-bold">
                            انسخ الكود أدناه ونفذه في محرر SQL الخاص بـ Supabase لحل المشكلة بشكل نهائي.
                        </p>
                    </div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-2 relative">
                    <button onClick={handleCopy} className="absolute top-4 left-4 z-10 bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 hover:bg-white/20 transition-all">
                        {copied ? <><Check size={14} className="text-emerald-300"/> تم النسخ</> : <><Copy size={14}/> نسخ الكود</>}
                    </button>
                    <pre className="w-full h-64 overflow-auto text-left bg-transparent p-4 rounded-xl text-emerald-300 font-mono text-[10px] no-scrollbar selection:bg-indigo-500 selection:text-white"><code>{emergencySqlCode}</code></pre>
                </div>
            </div>
        </div>
    );
};


const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clicks, setClicks] = useState(0);
  const [showSql, setShowSql] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    gender: 'male'
  });

  const handleTitleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    // Reset timer on each click
    const timer = setTimeout(() => {
        setClicks(0);
    }, 1500);

    if (newClicks >= 5) {
        setShowSql(true);
        setClicks(0);
        clearTimeout(timer);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const mobileClean = formData.mobile.trim();
    const isAdminNumber = mobileClean === '55315661';
    const virtualEmail = `${mobileClean}@system.local`;

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("كلمات المرور غير متطابقة");
        }
        if (mobileClean.length < 7) {
          throw new Error("رقم الموبايل غير صحيح");
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: { data: { full_name: formData.fullName } }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: authData.user.id,
            full_name: formData.fullName,
            phone: mobileClean,
            gender: formData.gender,
            role: isAdminNumber ? 'admin' : 'teacher',
            is_approved: isAdminNumber ? true : false 
          }]);
          
          if (profileError) throw profileError;

          if (isAdminNumber) {
            setSuccess("تم إنشاء حساب الإدارة بنجاح! يمكنك الدخول الآن.");
            setIsSignUp(false);
          } else {
            setSuccess("تم إرسال طلب الانضمام! أدخل كود التفعيل لتنشيط حساب إدارة المحتوى الخاص بك.");
            setIsSignUp(false);
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("بيانات الدخول غير صحيحة");
          }
          throw signInError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo'] text-right">
      {showSql && <EmergencySqlViewer onHide={() => setShowSql(false)} />}

      <div className="bg-white w-full max-w-[480px] p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden mb-10">
        <div className="relative z-10">
          <div onClick={handleTitleClick} title="انقر 5 مرات للوصول الطارئ" className="flex flex-col items-center mb-10 text-center cursor-help">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white mb-5 shadow-2xl rotate-3">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              نظام إدارة المحتوى <br/> <span className="text-indigo-600 text-lg">التعليمي المطور</span>
            </h1>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex gap-3 border border-rose-100 animate-pulse">
              <ShieldAlert size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold flex gap-3 border border-emerald-100">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                  <User size={12} /> الاسم الكامل
                </label>
                <input required name="fullName" type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={formData.fullName} onChange={handleChange} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                <Phone size={12} /> رقم الهاتف
              </label>
              <input required name="mobile" type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left font-bold outline-none" placeholder="09xxxxxxxx" value={formData.mobile} onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                <Lock size={12} /> كلمة السر
              </label>
              <input required name="password" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left font-bold outline-none" value={formData.password} onChange={handleChange} />
            </div>

            {isSignUp && (
               <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                   <Lock size={12} /> تأكيد كلمة السر
                </label>
                <input required name="confirmPassword" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left font-bold outline-none" value={formData.confirmPassword} onChange={handleChange} />
              </div>
            )}
            
            <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl transition-all h-16 mt-4 active:scale-95 disabled:opacity-50">
              {loading ? "جاري التحقق..." : (isSignUp ? 'فتح حساب محتوى جديد' : 'تسجيل الدخول للنظام')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }} className="text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
              {isSignUp ? 'لديك حساب محتوى؟ سجل دخولك' : 'مدير محتوى جديد؟ أنشئ حسابك'}
              <ArrowRight size={16} className={isSignUp ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 opacity-70">
        <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
          <Code2 size={16} />
          <span>برمجة : ايهاب جمال غزال</span>
        </div>
      </div>
    </div>
  );
};

export default Login;