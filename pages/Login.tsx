import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, GraduationCap, UserPlus } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'تم إنشاء الحساب! تحقق من بريدك أو قم بتسجيل الدخول الآن.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'حدث خطأ ما' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white mb-4 shadow-lg shadow-indigo-100">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">TutorTrack Pro</h1>
          <p className="text-slate-500 font-bold mt-2">
            {isSignUp ? 'أنشئ حسابك للبدء' : 'مرحباً بعودتك، سجل دخولك'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-sm font-bold ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 mr-2">البريد الإلكتروني</label>
            <input required type="email" placeholder="example@mail.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 mr-2">كلمة المرور</label>
            <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
             {isSignUp ? <UserPlus size={20}/> : <LogIn size={20}/>}
             {loading ? 'جاري المعالجة...' : (isSignUp ? 'إنشاء حساب' : 'دخول')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 font-black text-sm hover:underline"
          >
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;