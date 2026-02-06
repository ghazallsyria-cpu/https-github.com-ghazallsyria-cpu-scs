
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldAlert, Phone, Lock, 
  ArrowRight, CheckCircle2, AlertCircle,
  GraduationCap
} from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = `${phone}@summit.com`;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError("فشل تسجيل الدخول، تأكد من البيانات.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 font-['Cairo'] relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[120px]"></div>
       </div>

       <div className="w-full max-w-xl relative z-10 animate-in zoom-in duration-500">
          <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border border-white/40 flex flex-col items-center">
             
             <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 mb-8">
                <GraduationCap size={48} />
             </div>

             <h1 className="text-3xl font-black text-slate-900 mb-2">منصة القمة التعليمية</h1>
             <p className="text-slate-400 font-bold mb-12 text-center">نظام رقمي متكامل لإدارة المحتوى والتحصيل العلمي</p>

             <form onSubmit={handleLogin} className="w-full space-y-6">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-black animate-in shake duration-300">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                <div className="space-y-2">
                   <div className="relative">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        required
                        placeholder="رقم الهاتف" 
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold focus:ring-2 ring-indigo-500 transition-all text-right"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="relative">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        required
                        type="password"
                        placeholder="كلمة المرور" 
                        className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold focus:ring-2 ring-indigo-500 transition-all text-right"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                   </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {loading ? 'جاري التحقق...' : 'دخول النظام'} <ArrowRight size={20} />
                </button>
             </form>

             <div className="mt-12 flex items-center gap-8 text-slate-300 font-black text-[10px] tracking-[0.2em] uppercase">
                <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-indigo-500" /> أمان عالي</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-indigo-500" /> نسخة v4.5</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-indigo-500" /> وصول سريع</span>
             </div>
          </div>
          
          <p className="mt-8 text-center text-slate-400 font-bold text-sm">
             بإدارة المعلم: <span className="text-slate-900">ايهاب جمال غزال</span>
          </p>
       </div>
    </div>
  );
};

export default Login;
