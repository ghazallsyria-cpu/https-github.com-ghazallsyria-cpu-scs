import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

const ADMIN_PHONE = '55315661';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: '', confirmPassword: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.trim();
    const isAdminNumber = mobileClean === ADMIN_PHONE;
    const virtualEmail = `${mobileClean}@system.local`;

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) throw new Error("كلمات المرور غير متطابقة");
        
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: {
            data: { 
              phone: mobileClean,
              full_name: formData.fullName
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (authData.user) {
          await supabase.from('profiles').upsert([{
            id: authData.user.id,
            full_name: formData.fullName,
            phone: mobileClean,
            role: isAdminNumber ? 'admin' : 'teacher',
            is_approved: isAdminNumber ? true : false 
          }]);
          setIsSignUp(false);
          alert(isAdminNumber ? "تم إنشاء حساب الإدارة بنجاح" : "تم إرسال طلب الانضمام، بانتظار موافقة الإدارة المركزية.");
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("بيانات الدخول غير صحيحة، يرجى مراجعة رقم الهاتف أو كلمة السر.");

        if (isAdminNumber && signInData.user) {
          await supabase.from('profiles').update({ role: 'admin', is_approved: true }).eq('id', signInData.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-['Cairo'] text-right" dir="rtl">
      
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[150px]"></div>
      </div>

      <div className="bg-white w-full max-w-xl p-14 lg:p-20 rounded-[5rem] shadow-2xl relative z-10 border border-white/80 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-full h-3 bg-gradient-to-l from-indigo-700 to-indigo-500"></div>
        
        <div className="flex flex-col items-center mb-16">
          <div className="bg-gradient-to-tr from-indigo-700 to-indigo-500 p-7 rounded-[2.8rem] text-white mb-10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-700">
            <GraduationCap size={64} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 leading-tight text-center">
            {isSignUp ? 'عضوية جديدة' : 'بوابة المنصة الرقمية'}
            <br/>
            <span className="text-indigo-600 text-[11px] font-black tracking-[0.5em] uppercase mt-6 block">ELITE MANAGEMENT SYSTEM</span>
          </h2>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-8 rounded-[2rem] mb-12 text-sm font-black border border-rose-100 flex items-center gap-5 animate-shake">
          <ShieldCheck size={24} className="shrink-0" /> {error}
        </div>}

        <form onSubmit={handleAuth} className="space-y-8">
          {isSignUp && (
            <div className="space-y-3">
              <label className="text-[12px] font-black text-slate-400 mr-5 uppercase tracking-[0.2em]">الاسم بالكامل</label>
              <input required placeholder="الاسم الثلاثي..." className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-black outline-none focus:bg-white focus:border-indigo-100 transition-all text-base" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          <div className="space-y-3">
             <label className="text-[12px] font-black text-slate-400 mr-5 uppercase tracking-[0.2em] block">رقم الهاتف المسجل</label>
             <div className="relative">
               <Phone className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
               <input required type="tel" placeholder="00000000" className="w-full p-7 pr-20 bg-slate-50 border-2 border-slate-50 rounded-[2.2rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all tracking-[0.15em] text-lg" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
             </div>
          </div>
          <div className="space-y-3">
             <label className="text-[12px] font-black text-slate-400 mr-5 uppercase tracking-[0.2em] block">كلمة المرور</label>
             <div className="relative">
               <Lock className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
               <input required type="password" placeholder="••••••••" className="w-full p-7 pr-20 bg-slate-50 border-2 border-slate-50 rounded-[2.2rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all text-lg" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
          </div>
          
          <button disabled={loading} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black shadow-[0_25px_50px_-10px_rgba(79,70,229,0.4)] hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-5 text-xl mt-6">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? <><Sparkles size={24}/> تسجيل البيانات</> : 'دخول المنصة')}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-16 text-slate-400 font-black text-[12px] uppercase tracking-[0.4em] hover:text-indigo-600 transition-all duration-300">
          {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'طلب انضمام جديد'}
        </button>
      </div>
      
      <p className="mt-12 text-slate-400 font-black text-[11px] uppercase tracking-[0.5em] relative z-10 opacity-60">© 2025 ELITE MANAGEMENT CORE SYSTEM</p>
    </div>
  );
};

export default Login;