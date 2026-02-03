
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, GraduationCap, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Cairo']">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white mb-4 shadow-xl shadow-indigo-100">
            <GraduationCap size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">نظام إدارة الدروس</h1>
          <p className="text-slate-500 mt-2 font-bold">يرجى تسجيل الدخول للمتابعة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-rose-100">
              <AlertCircle size={18} /> {error === 'Invalid login credentials' ? 'بريد إلكتروني أو كلمة مرور غير صحيحة' : error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-600 mr-1">البريد الإلكتروني</label>
            <input 
              required type="email" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-600 mr-1">كلمة المرور</label>
            <input 
              required type="password" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : <><LogIn size={20} /> دخول</>}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-sm font-bold">
          نظام مشفر وآمن لاتحاد المعلمين
        </p>
      </div>
    </div>
  );
};

export default Login;
