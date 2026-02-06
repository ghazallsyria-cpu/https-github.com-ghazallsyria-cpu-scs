
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle, School, ChevronLeft, UserCircle, Briefcase } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-['Cairo']" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-600 to-amber-500"></div>
      
      <div className="bg-white w-full max-w-lg p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-100 relative overflow-hidden">
        
        {/* Identity Toggle (Very Clear Now) */}
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] mb-12 relative z-10">
           <button 
             onClick={() => { setIsParentMode(true); setError(null); }}
             className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.8rem] font-black text-sm transition-all duration-500 ${isParentMode ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400'}`}
           >
             <UserCircle size={20} /> بوابة ولي الأمر
           </button>
           <button 
             onClick={() => { setIsParentMode(false); setError(null); }}
             className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.8rem] font-black text-sm transition-all duration-500 ${!isParentMode ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}
           >
             <Briefcase size={20} /> بوابة المعلمين
           </button>
        </div>

        <div className="flex flex-col items-center mb-10 text-center">
           <div className={`p-6 rounded-[2.5rem] ${isParentMode ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} mb-6 transition-colors duration-700`}>
              {isParentMode ? <School size={50} /> : <GraduationCap size={50} />}
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">منصة القمة التعليمية</h2>
           <p className="text-slate-400 font-bold mt-2 text-sm">
             {isParentMode ? 'متابعة أداء ومستحقات ابنكم الدراسية' : 'إدارة الحصص والطلاب والتحصيل المالي'}
           </p>
        </div>

        {error && (
          <div className={`p-5 rounded-2xl mb-8 text-xs font-black border flex items-center gap-4 animate-in slide-in-from-top-2 ${error.includes("بنجاح") ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <AlertCircle size={20} className="shrink-0" /> {error}
          </div>
        )}

        {isParentMode ? (
          <form onSubmit={handleParentLogin} className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">رقم هاتف الطالب أو ولي الأمر</label>
               <div className="relative">
                 <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input 
                   required 
                   type="tel" 
                   placeholder="0000 0000" 
                   className="w-full p-6 pr-16 bg-slate-50 border-2 border-transparent rounded-[2.2rem] font-black text-left outline-none focus:bg-white focus:border-emerald-600 transition-all text-2xl shadow-inner" 
                   value={formData.mobile} 
                   onChange={e => setFormData({...formData, mobile: e.target.value})} 
                 />
               </div>
            </div>
            <button 
              disabled={loading} 
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2.2rem] font-black shadow-2xl transition-all flex items-center justify-center gap-4 text-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" /> : 'دخول فوري للمتابعة'}
              <ChevronLeft size={24} />
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold leading-relaxed px-10">
              الدخول آمن برقم الهاتف المسجل لدى المعلم، لا يتطلب كلمة مرور لولي الأمر.
            </p>
          </form>
        ) : (
          <form onSubmit={handleTeacherLogin} className="space-y-6 animate-in fade-in duration-500">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">الاسم الكامل</label>
                <input required placeholder="الاسم الثلاثي..." className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
            )}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">رقم الهاتف (اسم المستخدم)</label>
               <div className="relative">
                 <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="tel" className="w-full p-5 pr-14 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-left outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">كلمة المرور</label>
               <div className="relative">
                 <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="password" placeholder="••••••••" className="w-full p-5 pr-14 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-left outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>
            </div>
            <button disabled={loading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.2rem] font-black shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 text-xl">
              {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تقديم طلب انضمام' : 'دخول النظام')}
            </button>
            <div className="text-center">
               <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-black text-xs hover:underline transition-all">
                 {isSignUp ? 'لديك حساب؟ سجل دخولك الآن' : 'معلم جديد؟ قدم طلب انضمام للقمة'}
               </button>
            </div>
          </form>
        )}
      </div>
      <p className="mt-10 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] opacity-50">Summit Education System • 2025</p>
    </div>
  );
};

export default Login;
