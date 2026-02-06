
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle, School, ChevronLeft, UserCircle, Briefcase, Sparkles } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isParentMode, setIsParentMode] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: ''
  });

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.replace(/\D/g, '');
    if (mobileClean.length < 8) {
      setError("يرجى إدخال رقم هاتف صحيح");
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_parent_access', { 
        phone_to_check: mobileClean 
      });

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        localStorage.setItem('parent_session_phone', mobileClean);
        localStorage.setItem('parent_student_name', data[0].student_name);
        window.location.reload();
      } else {
        setError("عذراً، هذا الرقم غير مسجل كولي أمر لدينا.");
      }
    } catch (err: any) {
      setError("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.replace(/\D/g, '');
    const virtualEmail = `${mobileClean}@summit.edu`.toLowerCase();

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: { data: { phone: mobileClean, full_name: formData.fullName } }
        });
        if (signUpError) throw signUpError;
        setError("تم تقديم طلبك بنجاح. بانتظار تفعيل المدير.");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("بيانات الدخول غير صحيحة.");
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-['Cairo'] overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-600 to-amber-500"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]"></div>

      <div className="bg-white w-full max-w-lg p-8 md:p-14 rounded-[3.5rem] md:rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 relative z-10 overflow-hidden">
        
        {/* Entrance Toggle - Massive and Clear */}
        <div className="bg-slate-100 p-2 rounded-[2.5rem] mb-12 flex relative overflow-hidden border border-slate-200">
           <button 
             onClick={() => { setIsParentMode(true); setError(null); }}
             className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 relative z-10 ${isParentMode ? 'text-white' : 'text-slate-500 hover:text-emerald-600'}`}
           >
             <UserCircle size={22} /> بوابة أولياء الأمور
           </button>
           <button 
             onClick={() => { setIsParentMode(false); setError(null); }}
             className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 relative z-10 ${!isParentMode ? 'text-white' : 'text-slate-500 hover:text-indigo-600'}`}
           >
             <Briefcase size={22} /> بوابة المعلمين والمدراء
           </button>
           {/* Animated Slider */}
           <div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-[2rem] transition-all duration-500 ease-out ${isParentMode ? 'right-2 bg-emerald-600 shadow-xl shadow-emerald-600/20' : 'right-[calc(50%+4px)] bg-indigo-600 shadow-xl shadow-indigo-600/20'}`}></div>
        </div>

        <div className="flex flex-col items-center mb-12 text-center">
           <div className={`p-8 rounded-[3rem] ${isParentMode ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'} mb-8 transition-all duration-700 shadow-xl`}>
              {isParentMode ? <School size={64} /> : <GraduationCap size={64} />}
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">القمة التعليمية</h2>
           <p className="text-slate-400 font-bold mt-3 text-base flex items-center gap-2">
             <Sparkles size={16} className={isParentMode ? 'text-emerald-500' : 'text-indigo-500'} />
             {isParentMode ? 'أهلاً بكم في بوابة المتابعة المباشرة' : 'نظام الإدارة والتحصيل المالي الموحد'}
           </p>
        </div>

        {error && (
          <div className={`p-6 rounded-[2rem] mb-10 text-xs font-black border flex items-center gap-4 animate-in slide-in-from-top-4 ${error.includes("بنجاح") ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <AlertCircle size={22} className="shrink-0" /> {error}
          </div>
        )}

        {isParentMode ? (
          <form onSubmit={handleParentLogin} className="space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="space-y-4">
               <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest block">رقم الهاتف المسجل (دون كود الدولة)</label>
               <div className="relative">
                 <Phone className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                 <input 
                   required 
                   type="tel" 
                   placeholder="0000 0000" 
                   className="w-full p-7 pr-20 bg-slate-50 border-2 border-transparent rounded-[2.5rem] font-black text-left outline-none focus:bg-white focus:border-emerald-600 transition-all text-2xl shadow-inner tracking-widest" 
                   value={formData.mobile} 
                   onChange={e => setFormData({...formData, mobile: e.target.value})} 
                 />
               </div>
            </div>
            <button 
              disabled={loading} 
              className="w-full py-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2.5rem] font-black shadow-2xl transition-all flex items-center justify-center gap-5 text-2xl active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" /> : 'دخول فوري للمتابعة'}
              <ChevronLeft size={28} />
            </button>
            <div className="text-center px-10">
              <p className="text-xs text-slate-400 font-black leading-relaxed">
                * لأولياء الأمور: الدخول يتم مباشرة عبر رقم الهاتف المسجل لدينا دون الحاجة لكلمة مرور.
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTeacherLogin} className="space-y-8 animate-in fade-in zoom-in duration-500">
            {isSignUp && (
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest block">الاسم الكامل</label>
                <input required placeholder="الاسم الثلاثي المعتمد..." className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2.2rem] font-black outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner text-lg" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
            )}
            <div className="space-y-3">
               <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest block">رقم الهاتف (المستخدم)</label>
               <div className="relative">
                 <Phone className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input required type="tel" className="w-full p-6 pr-16 bg-slate-50 border-2 border-transparent rounded-[2.2rem] font-black text-left outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner text-xl" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest block">كلمة المرور</label>
               <div className="relative">
                 <Lock className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input required type="password" placeholder="••••••••" className="w-full p-6 pr-16 bg-slate-50 border-2 border-transparent rounded-[2.2rem] font-black text-left outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner text-xl" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>
            </div>
            <button disabled={loading} className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-95 disabled:opacity-50 text-2xl">
              {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تقديم طلب انضمام' : 'دخول النظام')}
            </button>
            <div className="text-center">
               <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-black text-sm hover:underline transition-all">
                 {isSignUp ? 'لديك حساب؟ سجل دخولك الآن' : 'معلم جديد؟ قدم طلب انضمام للقمة'}
               </button>
            </div>
          </form>
        )}
      </div>
      <p className="mt-12 text-slate-400 font-black text-[11px] uppercase tracking-[0.4em] opacity-60">Summit Digital Ecosystem • 2025</p>
    </div>
  );
};

export default Login;
