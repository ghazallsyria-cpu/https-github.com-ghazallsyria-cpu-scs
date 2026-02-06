
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle, School, ChevronLeft } from 'lucide-react';

const ADMIN_PHONE = '55315661';

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
        setError("عذراً، هذا الرقم غير مسجل لدينا كولي أمر. يرجى التواصل مع المعلم لإضافتك.");
      }
    } catch (err: any) {
      setError("حدث خطأ في النظام، يرجى المحاولة لاحقاً");
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
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: { data: { phone: mobileClean, full_name: formData.fullName } }
        });
        if (signUpError) throw signUpError;
        setError("تم تقديم طلبك بنجاح. يرجى انتظار تفعيل الحساب.");
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-['Cairo'] text-right" dir="rtl">
      <div className="bg-white w-full max-w-lg p-10 rounded-[3.5rem] shadow-2xl relative border border-slate-100 overflow-hidden">
        
        <div className="flex flex-col items-center mb-10">
          <div className={`p-5 rounded-3xl ${isParentMode ? 'bg-emerald-600' : 'bg-indigo-600'} text-white mb-6 shadow-xl transition-colors duration-500`}>
            {isParentMode ? <School size={40} /> : <GraduationCap size={40} />}
          </div>
          <h2 className="text-2xl font-black text-slate-900">منصة القمة التعليمية</h2>
          <p className="text-slate-400 font-bold mt-1">
            {isParentMode ? 'بوابة أولياء الأمور (دخول سريع)' : 'بوابة المعلمين والمدراء'}
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-8">
           <button onClick={() => {setIsParentMode(true); setError(null);}} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${isParentMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>أنا ولي أمر</button>
           <button onClick={() => {setIsParentMode(false); setError(null);}} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${!isParentMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>أنا معلم</button>
        </div>

        {error && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-black border flex items-center gap-3 ${error.includes("بنجاح") ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {isParentMode ? (
          <form onSubmit={handleParentLogin} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">رقم الهاتف المسجل</label>
               <div className="relative">
                 <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="tel" placeholder="أدخل رقم هاتفك..." className="w-full p-5 pr-12 bg-slate-50 border rounded-2xl font-black text-left outline-none focus:bg-white focus:border-emerald-600 transition-all text-xl" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
               </div>
            </div>
            <button disabled={loading} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 text-lg">
              {loading ? <RefreshCw className="animate-spin" /> : 'دخول فوري للمتابعة'}
              <ChevronLeft size={20} />
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold">لا حاجة لكلمة سر، سيتم التحقق من رقمك في سجلات الطلاب.</p>
          </form>
        ) : (
          <form onSubmit={handleTeacherLogin} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">الاسم الكامل</label>
                <input required placeholder="الاسم الثلاثي..." className="w-full p-4 bg-slate-50 border rounded-2xl font-black outline-none focus:border-indigo-600 transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
            )}
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">رقم الهاتف</label>
               <div className="relative">
                 <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="tel" className="w-full p-4 pr-12 bg-slate-50 border rounded-2xl font-black text-left outline-none focus:border-indigo-600 transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">كلمة المرور</label>
               <div className="relative">
                 <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input required type="password" placeholder="••••••••" className="w-full p-4 pr-12 bg-slate-50 border rounded-2xl font-black text-left outline-none focus:border-indigo-600 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>
            </div>
            <button disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3">
              {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تقديم طلب انضمام' : 'دخول المعلمين')}
            </button>
            <div className="text-center">
               <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-black text-xs hover:underline">
                 {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'معلم جديد؟ قدم طلب انضمام'}
               </button>
            </div>
          </form>
        )}
      </div>
      <p className="mt-8 text-slate-400 font-black text-[10px] uppercase tracking-widest">Summit Education System © 2025</p>
    </div>
  );
};

export default Login;
