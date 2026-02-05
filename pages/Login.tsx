import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, User, ArrowRight, Code2, RefreshCw } from 'lucide-react';

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
        
        // تسجيل المستخدم مع إضافة الرقم في الـ Metadata
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
          // محاولة إنشاء البروفايل
          await supabase.from('profiles').upsert([{
            id: authData.user.id,
            full_name: formData.fullName,
            phone: mobileClean,
            role: isAdminNumber ? 'admin' : 'teacher',
            is_approved: isAdminNumber ? true : false 
          }]);
          setIsSignUp(false);
          alert(isAdminNumber ? "تم إنشاء حساب المدير" : "تم إرسال الطلب");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("بيانات الدخول خاطئة");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo'] text-right">
      <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white mb-4 shadow-xl">
            <GraduationCap size={40} />
          </div>
          <h2 className="text-xl font-black text-slate-900 leading-tight text-center">دخول النظام <br/><span className="text-indigo-600">التعليمي المطور</span></h2>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-xs font-bold border border-rose-100">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input required placeholder="الاسم بالكامل" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:bg-white" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          )}
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
             <input required type="tel" placeholder="55315661" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-left outline-none focus:bg-white" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة السر</label>
             <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-left outline-none focus:bg-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          {isSignUp && (
            <input required type="password" placeholder="تأكيد كلمة السر" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-left outline-none focus:bg-white" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
          )}
          <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin mx-auto" /> : (isSignUp ? 'إنشاء حساب' : 'دخول النظام')}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-8 text-slate-500 font-bold text-sm">
          {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'مستخدم جديد؟ أنشئ حسابك'}
        </button>
      </div>
    </div>
  );
};

export default Login;