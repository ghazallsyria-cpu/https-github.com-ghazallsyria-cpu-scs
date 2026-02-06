
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle, School, ChevronLeft, UserCircle, Briefcase, UserPlus } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isParentMode, setIsParentMode] = useState(true); // Default to Parent for easier access
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
      setError("يرجى إدخال رقم هاتف صحيح (8 أرقام على الأقل)");
      setLoading(false);
      return;
    }

    try {
      // Use the RPC function to check access
      const { data, error: rpcError } = await supabase.rpc('verify_parent_access', { 
        phone_to_check: mobileClean 
      });

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        localStorage.setItem('parent_session_phone', mobileClean);
        localStorage.setItem('parent_student_name', data[0].student_name);
        window.location.reload();
      } else {
        setError("عذراً، هذا الرقم غير مسجل كولي أمر لدينا. يرجى التواصل مع الأستاذ.");
      }
    } catch (err: any) {
      setError("خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
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
          options: { 
            data: { phone: mobileClean, full_name: formData.fullName } 
          }
        });
        if (signUpError) throw signUpError;
        setError("تم تقديم طلبك بنجاح. بانتظار تفعيل المدير.");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة.");
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-['Cairo']" dir="rtl">
      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-amber-500"></div>
      
      <div className="bg-white w-full max-w-lg p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Toggle between Parent and Teacher */}
        <div className="flex bg-slate-100 p-1.5 rounded-full mb-10 relative z-10 border border-slate-200">
           <button 
             onClick={() => { setIsParentMode(true); setError(null); }}
             className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-black text-sm transition-all duration-300 ${isParentMode ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-emerald-600'}`}
           >
             <School size={18} /> دخول ولي الأمر
           </button>
           <button 
             onClick={() => { setIsParentMode(false); setError(null); }}
             className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-black text-sm transition-all duration-300 ${!isParentMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
           >
             <Briefcase size={18} /> بوابة المعلمين
           </button>
        </div>

        <div className="flex flex-col items-center mb-10 text-center">
           <div className={`p-6 rounded-3xl ${isParentMode ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} mb-6 transition-colors duration-500`}>
              {isParentMode ? <UserCircle size={48} /> : <GraduationCap size={48} />}
           </div>
           <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">القمة التعليمية</h2>
           <p className="text-slate-400 font-bold mt-2 text-sm">
             {isParentMode ? 'نظام متابعة الطلاب لأولياء الأمور' : 'لوحة تحكم المعلمين والمدراء'}
           </p>
        </div>

        {error && (
          <div className={`p-4 rounded-2xl mb-8 text-xs font-black border flex items-center gap-3 animate-bounce ${error.includes("بنجاح") ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {isParentMode ? (
          <form onSubmit={handleParentLogin} className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">رقم الهاتف المسجل</label>
               <div className="relative">
                 <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input 
                   required 
                   type="tel" 
                   placeholder="رقم الهاتف..." 
                   className="w-full p-6 pr-14 bg-slate-50 border-2 border-transparent rounded-3xl font-black text-left outline-none focus:bg-white focus:border-emerald-500 transition-all text-xl shadow-inner" 
                   value={formData.mobile} 
                   onChange={e => setFormData({...formData, mobile: e.target.value})} 
                 />
               </div>
            </div>
            <button 
              disabled={loading} 
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black shadow-xl transition-all flex items-center justify-center gap-3 text-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" /> : 'دخول فوري للمتابعة'}
              <ChevronLeft size={20} />
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold leading-relaxed px-6">
              * الدخول متاح فقط لأرقام الهواتف المسجلة مسبقاً في قاعدة بيانات الطلاب.
            </p>
          </form>
        ) : (
          <form onSubmit={handleTeacherLogin} className="space-y-6 animate-in fade-in duration-500">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest text-right block">الاسم الكامل</label>
                <input required placeholder="الاسم الثلاثي..." className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
            )}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest text-right block">رقم الهاتف (المستخدم)</label>
               <div className="relative">
                 <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="tel" className="w-full p-5 pr-14 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-left outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest text-right block">كلمة المرور</label>
               <div className="relative">
                 <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="password" placeholder="••••••••" className="w-full p-5 pr-14 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-left outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>
            </div>
            <button disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-lg">
              {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تقديم طلب انضمام' : 'دخول النظام')}
            </button>
            <div className="text-center">
               <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-black text-xs hover:underline transition-all">
                 {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'معلم جديد؟ قدم طلب انضمام للقمة'}
               </button>
            </div>
          </form>
        )}
      </div>
      <p className="mt-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Summit System • Educational Excellence</p>
    </div>
  );
};

export default Login;
