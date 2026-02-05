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
          alert(isAdminNumber ? "تم إنشاء حساب الإدارة بنجاح" : "تم إرسال طلب الانضمام، بانتظار موافقة الإدارة.");
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.");

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
      
      {/* Visual Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white w-full max-w-lg p-12 lg:p-16 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative z-10 border border-white/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-3 bg-gradient-to-l from-indigo-600 to-indigo-400"></div>
        
        <div className="flex flex-col items-center mb-14">
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white mb-8 shadow-2xl shadow-indigo-100 rotate-6 hover:rotate-0 transition-transform duration-500">
            <GraduationCap size={56} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight text-center">
            {isSignUp ? 'إنشاء حساب جديد' : 'بوابة المعلمين'}
            <br/>
            <span className="text-indigo-600 text-[10px] font-black tracking-[0.4em] uppercase mt-4 block">PREMIUM EDUCATIONAL CORE</span>
          </h2>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-6 rounded-3xl mb-10 text-xs font-black border border-rose-100 flex items-center gap-4 animate-shake">
          <ShieldCheck size={20} className="shrink-0" /> {error}
        </div>}

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الكامل</label>
              <input required placeholder="الاسم الثلاثي..." className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-100 transition-all text-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          <div className="space-y-2">
             <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest block">رقم الهاتف</label>
             <div className="relative">
               <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input required type="tel" placeholder="00000000" className="w-full p-6 pr-16 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all tracking-widest" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest block">كلمة السر</label>
             <div className="relative">
               <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input required type="password" placeholder="••••••••" className="w-full p-6 pr-16 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
          </div>
          {isSignUp && (
            <div className="space-y-2">
               <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest block">تأكيد كلمة السر</label>
               <input required type="password" placeholder="••••••••" className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          )}
          
          <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 text-lg mt-4">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? <><Sparkles size={22}/> إنشاء الحساب</> : 'دخول المنصة')}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-12 text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors">
          {isSignUp ? 'هل تملك حساباً؟ سجل دخولك' : 'لا تملك حساباً؟ اطلب الانضمام'}
        </button>
      </div>
      
      <p className="mt-10 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] relative z-10">© 2025 ELITE TEACHER PORTAL</p>
    </div>
  );
};

export default Login;