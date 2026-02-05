import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, User, ArrowRight, Code2, Copy, Check, Terminal, X } from 'lucide-react';

const emergencySqlCode = `-- [V7] إصلاح صلاحيات المدير (Emergency Fix)
-- نفذ هذا الكود في SQL Editor بداخل Supabase

CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual read" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin managed" ON public.profiles;

CREATE POLICY "Allow individual read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow admin managed" ON public.profiles FOR ALL USING (public.is_admin_check(auth.uid()));

UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
`;

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [clicks, setClicks] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: '', confirmPassword: '', gender: 'male'
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.trim();
    const isAdminNumber = mobileClean === '55315661';
    const virtualEmail = `${mobileClean}@system.local`;

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) throw new Error("كلمات المرور غير متطابقة");
        
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
          if (profileError) console.error("Profile creation error:", profileError);
          setIsSignUp(false);
          alert(isAdminNumber ? "تم إنشاء حساب المدير بنجاح" : "تم إرسال طلب الانضمام للنظام");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("رقم الهاتف أو كلمة السر غير صحيحة");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo'] text-right">
      <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col items-center mb-8" onClick={() => { setClicks(c => c+1); if(clicks > 5) setShowSql(true); }}>
          <div className="bg-indigo-600 p-4 rounded-2xl text-white mb-4 shadow-xl shadow-indigo-100 rotate-3 transition-transform hover:rotate-0">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">نظام إدارة المحتوى <br/><span className="text-indigo-600">التعليمي المطور</span></h1>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-xs font-bold border border-rose-100 animate-in fade-in duration-300">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase tracking-widest"><User size={12}/> الاسم الكامل</label>
              <input required placeholder="الاسم ثلاثي..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase tracking-widest"><Phone size={12}/> رقم الهاتف</label>
            <input required type="tel" placeholder="09xxxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-left focus:bg-white focus:border-indigo-500 transition-all outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase tracking-widest"><Lock size={12}/> كلمة السر</label>
            <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-left focus:bg-white focus:border-indigo-500 transition-all outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase tracking-widest"><Lock size={12}/> تأكيد كلمة السر</label>
              <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-left focus:bg-white focus:border-indigo-500 transition-all outline-none" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          )}
          <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 mt-2">
            {loading ? "جاري المعالجة..." : (isSignUp ? 'إنشاء حساب محتوى جديد' : 'تسجيل الدخول للنظام')}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-8 text-slate-500 font-bold text-sm hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors">
          {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'مستخدم جديد؟ أنشئ حسابك'}
          <ArrowRight size={16} className={isSignUp ? 'rotate-180' : ''} />
        </button>
      </div>

      {showSql && (
        <div className="fixed inset-0 bg-slate-900/90 p-4 flex items-center justify-center z-[1000] backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-3xl shadow-2xl relative">
            <button onClick={() => setShowSql(false)} className="absolute top-8 left-8 text-rose-500 hover:rotate-90 transition-transform"><X size={32}/></button>
            <div className="flex items-center gap-4 mb-6">
              <Terminal size={32} className="text-indigo-600 bg-indigo-50 p-3 rounded-2xl" />
              <div>
                <h2 className="text-xl font-black text-indigo-700">منفذ الطوارئ SQL V7</h2>
                <p className="text-xs text-slate-500 font-bold">انسخ هذا الكود ونفذه في Supabase SQL Editor لإصلاح الصلاحيات.</p>
              </div>
            </div>
            <div className="bg-slate-950 p-6 rounded-3xl relative">
               <button onClick={() => { navigator.clipboard.writeText(emergencySqlCode); alert('تم نسخ الكود'); }} className="absolute top-4 left-4 bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/20 transition-all">نسخ الكود</button>
               <pre className="text-emerald-400 font-mono text-[10px] overflow-auto h-[40vh] no-scrollbar leading-relaxed"><code>{emergencySqlCode}</code></pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;