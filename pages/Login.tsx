import React, { useState } from 'react';
import { supabase } from '../supabase.ts';
import { GraduationCap, ShieldAlert, CheckCircle2, Phone, Lock, User, UserCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    gender: 'male'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // تحويل رقم الموبايل إلى صيغة بريد إلكتروني وهمية لمحرك Supabase
    const virtualEmail = `${formData.mobile}@tutor.app`;

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("كلمات المرور غير متطابقة");
        }
        if (formData.mobile.length < 8) {
          throw new Error("رقم الموبايل غير صحيح");
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // إنشاء البروفايل يدوياً لضمان حفظ البيانات الإضافية
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: authData.user.id,
            full_name: formData.fullName,
            phone: formData.mobile,
            gender: formData.gender,
            role: 'teacher',
            is_approved: false // الحساب يحتاج موافقة المدير
          }]);
          
          if (profileError) throw profileError;
          setSuccess("تم إنشاء الطلب! حسابك الآن بانتظار تفعيل المدير العام.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في العملية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Cairo'] selection:bg-indigo-100">
      <div className="bg-white w-full max-w-[480px] p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white mb-5 shadow-2xl shadow-indigo-100 rotate-3">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">TutorTrack <span className="text-indigo-600">Pro</span></h1>
            <p className="text-slate-400 font-bold mt-2">
              {isSignUp ? 'انضم لنخبة المعلمين المتميزين' : 'مرحباً بك مجدداً في نظامك الإداري'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-start gap-3 border border-rose-100 animate-in slide-in-from-top-2">
              <ShieldAlert size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-start gap-3 border border-emerald-100 animate-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase mr-2 tracking-widest flex items-center gap-1">
                  <User size={12} /> الاسم الكامل
                </label>
                <input required name="fullName" type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" value={formData.fullName} onChange={handleChange} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-2 tracking-widest flex items-center gap-1">
                <Phone size={12} /> رقم الموبايل
              </label>
              <input required name="mobile" type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left font-bold" placeholder="09xxxxxxxx" value={formData.mobile} onChange={handleChange} />
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase mr-2 tracking-widest flex items-center gap-1">
                  <UserCircle size={12} /> الجنس
                </label>
                <select name="gender" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer" value={formData.gender} onChange={handleChange}>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-2 tracking-widest flex items-center gap-1">
                <Lock size={12} /> كلمة المرور
              </label>
              <input required name="password" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left font-bold" value={formData.password} onChange={handleChange} />
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase mr-2 tracking-widest flex items-center gap-1">
                  <Lock size={12} /> تأكيد كلمة المرور
                </label>
                <input required name="confirmPassword" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left font-bold" value={formData.confirmPassword} onChange={handleChange} />
              </div>
            )}
            
            <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-4 h-16">
              {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : (isSignUp ? 'تقديم طلب تسجيل' : 'دخول للمنصة')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }} className="text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors flex items-center gap-2">
              {isSignUp ? 'لديك حساب مفعل؟ سجل دخولك' : 'مدرس جديد؟ أنشئ حسابك الآن'}
              <ArrowRight size={16} className={isSignUp ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;