import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, User, ArrowRight, Code2, RefreshCw, ShieldCheck } from 'lucide-react';

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
          // ترقية فورية للمدير في قاعدة البيانات
          await supabase.from('profiles').upsert([{
            id: authData.user.id,
            full_name: formData.fullName,
            phone: mobileClean,
            role: isAdminNumber ? 'admin' : 'teacher',
            is_approved: isAdminNumber ? true : false 
          }]);
          setIsSignUp(false);
          alert(isAdminNumber ? "تم إنشاء حساب المدير المطلق" : "تم إرسال طلب الانضمام للمدير");
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (signInError) throw new Error("رقم الهاتف أو كلمة السر غير صحيحة");

        // التأكد من حالة حساب المدير في Profiles
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo'] text-right">
      <div className="bg-white w-full max-w-md p-8 lg:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-2 bg-indigo-600"></div>
        
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white mb-6 shadow-xl shadow-indigo-100">
            <GraduationCap size={44} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight text-center">
            {isSignUp ? 'إنشاء حساب جديد' : 'دخول النظام الموحد'}
            <br/>
            <span className="text-indigo-600 text-sm font-bold tracking-widest uppercase mt-2 block">V15 DIGITAL CORE</span>
          </h2>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-8 text-[11px] font-black border border-rose-100 flex items-center gap-3">
          <ShieldCheck size={16} /> {error}
        </div>}

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الثلاثي</label>
              <input required placeholder="اكتب اسمك كاملاً" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest block">رقم الهاتف (المدير: 55315661)</label>
             <input required type="tel" placeholder="رقم الهاتف..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest block">كلمة السر</label>
             <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          {isSignUp && (
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest block">تأكيد كلمة السر</label>
               <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          )}
          <button disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تأكيد البيانات' : 'دخول المنصة')}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-10 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-indigo-600 transition-colors">
          {isSignUp ? 'هل تملك حساباً؟ سجل دخولك' : 'لا تملك حساباً؟ أنشئ حسابك الآن'}
        </button>
      </div>
    </div>
  );
};

export default Login;