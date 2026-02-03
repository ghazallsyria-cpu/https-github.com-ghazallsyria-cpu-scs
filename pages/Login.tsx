import React, { useState } from 'react';
import { supabase } from '../supabase.ts';
import { GraduationCap, ShieldAlert, CheckCircle2, Phone, Lock, User, ArrowRight, Code2 } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    const mobileClean = formData.mobile.trim();
    // الرقم المعتمد للمدير العام
    const isAdminNumber = mobileClean === '55315661';

    // المعرف التقني الداخلي المشتق من رقم الموبايل لتجنب طلب الإيميل من المستخدم
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
          options: { 
            data: { full_name: formData.fullName } 
          }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // تعيين الصلاحيات بناءً على رقم الموبايل
          // الرقم المحدد يكون مديراً ومفعلاً فوراً، البقية قيد الانتظار
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
            setSuccess("تم إنشاء حساب المدير بنجاح! يمكنك الدخول الآن ببياناتك المعتمدة.");
            setIsSignUp(false);
          } else {
            setSuccess("تم إرسال طلب الانضمام بنجاح! يرجى انتظار تفعيل حسابك من قبل المدير.");
          }
        }
      } else {
        // تسجيل الدخول العادي برقم الهاتف وكلمة السر
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("رقم الموبايل أو كلمة السر غير صحيحة");
          }
          throw signInError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع في النظام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo']">
      <div className="bg-white w-full max-w-[480px] p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden mb-10">
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white mb-5 shadow-2xl rotate-3">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              ادارة تحكم الطلاب <br/> <span className="text-indigo-600 text-lg">في النظام الخصوصي</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2">الإصدار المستقر للمدير والمعلمين</p>
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
                <input required name="fullName" type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.fullName} onChange={handleChange} />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                <Phone size={12} /> رقم الموبايل
              </label>
              <input required name="mobile" type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="09xxxxxxxx" value={formData.mobile} onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                <Lock size={12} /> كلمة المرور
              </label>
              <input required name="password" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.password} onChange={handleChange} />
            </div>

            {isSignUp && (
               <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1">
                   <Lock size={12} /> تأكيد كلمة المرور
                </label>
                <input required name="confirmPassword" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.confirmPassword} onChange={handleChange} />
              </div>
            )}
            
            <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl transition-all h-16 mt-4 active:scale-95 disabled:opacity-50">
              {loading ? "جاري التحقق..." : (isSignUp ? 'إنشاء حساب جديد' : 'دخول للنظام')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }} className="text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
              {isSignUp ? 'بالفعل لديك حساب؟ سجل دخولك' : 'مدرس جديد؟ أنشئ حسابك وتقدم بطلب انضمام'}
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