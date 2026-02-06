
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Key, Save, RefreshCw, CheckCircle, AlertCircle, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return showFeedback("كلمات المرور غير متطابقة", "error");
    }
    if (password.length < 6) {
      return showFeedback("يجب أن تكون كلمة المرور 6 أحرف على الأقل", "error");
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showFeedback("تم تحديث كلمة المرور بنجاح");
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showFeedback(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-32 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#1E1B4B] p-12 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-100"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Lock size={32} className="text-amber-400" />
            <span className="bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">إدارة أمان الحساب</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tighter mb-4">إعدادات <br/><span className="text-indigo-400">الخصوصية والأمان</span></h1>
          <p className="text-indigo-100/50 font-black text-lg max-w-xl">قم بتحديث بيانات الدخول الخاصة بك بانتظام لضمان حماية بيانات طلابك وسجلاتك المالية.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleUpdatePassword} className="bg-white p-10 md:p-16 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
           
           <div className="flex items-center gap-5 mb-4">
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shadow-inner">
                 <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">تغيير كلمة المرور</h3>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-[0.3em]">كلمة المرور الجديدة</label>
                 <div className="relative">
                    <input 
                       required 
                       type={showPass ? "text" : "password"} 
                       placeholder="••••••••"
                       className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-xl text-left outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" 
                       value={password} 
                       onChange={e => setPassword(e.target.value)} 
                    />
                    <button 
                       type="button" 
                       onClick={() => setShowPass(!showPass)}
                       className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-all"
                    >
                       {showPass ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-[0.3em]">تأكيد كلمة المرور</label>
                 <div className="relative">
                    <input 
                       required 
                       type={showPass ? "text" : "password"} 
                       placeholder="••••••••"
                       className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-xl text-left outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" 
                       value={confirmPassword} 
                       onChange={e => setConfirmPassword(e.target.value)} 
                    />
                 </div>
              </div>
           </div>

           <button 
              disabled={loading || !password} 
              className="w-full py-8 bg-indigo-600 text-white font-black rounded-[3rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 text-2xl disabled:opacity-50"
           >
              {loading ? <RefreshCw className="animate-spin" /> : <Save size={32} />}
              حفظ كلمة المرور الجديدة
           </button>

           <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
              <AlertCircle className="text-amber-600 shrink-0" size={24} />
              <p className="text-xs font-bold text-amber-800 leading-relaxed">تنبيه: عند تغيير كلمة المرور، سيتم تحديث بيانات الدخول فوراً. يرجى التأكد من حفظها في مكان آمن.</p>
           </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
