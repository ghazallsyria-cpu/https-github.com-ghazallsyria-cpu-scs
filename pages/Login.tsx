import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, GraduationCap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white mb-4"><GraduationCap size={48} /></div>
          <h1 className="text-2xl font-black">TutorTrack Pro</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <input required type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border rounded-2xl" value={email} onChange={e => setEmail(e.target.value)} />
          <input required type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border rounded-2xl" value={password} onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2">
             <LogIn size={20}/> {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;