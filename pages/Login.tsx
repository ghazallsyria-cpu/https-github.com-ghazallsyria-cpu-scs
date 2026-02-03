import React, { useState } from 'react';
import { supabase } from '../supabase.ts';
import { LogIn, GraduationCap, UserPlus, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتأكيد.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-['Cairo']">
      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white mb-4 shadow-xl shadow-indigo-100">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">TutorTrack Pro</h1>
          <p className="text-slate-500 font-bold mt-2">نظام إدارة المعلم الذكي</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">البريد الإلكتروني</label>
            <input required type="email" placeholder="mail@example.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mr-2 tracking-widest">كلمة المرور</label>
            <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-left" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2">
             {loading ? 'جاري المعالجة...' : (isSignUp ? 'إنشاء حساب جديد' : 'دخول النظام')}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-6 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors"
        >
          {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً كمعلم'}
        </button>
      </div>
    </div>
  );
};

export default Login;