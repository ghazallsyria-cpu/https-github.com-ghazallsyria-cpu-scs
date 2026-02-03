import React, { useState } from 'react';
import { supabase } from '../supabase.ts';
import { LogIn, GraduationCap, UserPlus, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('ghazallsyria@gmail.com');
  const [password, setPassword] = useState('Gh@870495');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: email === 'ghazallsyria@gmail.com' ? 'المدير العام' : 'معلم جديد',
            }
          }
        });
        if (error) throw error;
        setSuccess("تم إرسال الطلب بنجاح. إذا لم تصلك رسالة تفعيل، يرجى مراجعة إعدادات Supabase.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            throw new Error("لم يتم تفعيل الحساب بعد. يرجى إيقاف خيار 'Confirm Email' في إعدادات Supabase Auth لتتمكن من الدخول فوراً.");
          }
          throw error;
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-['Cairo']">
      <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white mb-4 shadow-xl shadow-indigo-100">
              <GraduationCap size={44} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">TutorTrack Pro</h1>
            <p className="text-slate-500 font-bold mt-2 text-center">
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول للنظام'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-100">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {error.includes("Email not confirmed") && (
                <div className="mt-3 p-3 bg-white/50 rounded-xl text-[11px] text-rose-700 leading-relaxed">
                  <strong>حل مشكلة البريد:</strong> ادخل لوحة تحكم Supabase &rarr; Auth &rarr; Settings ثم عطّل خيار <b>Confirm Email</b>.
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-start gap-3 border border-emerald-100">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">البريد الإلكتروني</label>
              <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-left font-bold" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">كلمة المرور</label>
              <input required type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-left font-bold" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            
            <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isSignUp ? 'أنشئ حسابي الآن' : 'دخول')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }} className="text-indigo-600 font-black text-sm hover:underline">
              {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ اضغط هنا للإنشاء'}
            </button>
            <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-4 rounded-xl">
              <HelpCircle size={16} className="shrink-0" />
              <p className="text-[10px] font-bold">تأكد من تعطيل Confirm Email في Supabase لتفادي مشاكل الرسائل.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;