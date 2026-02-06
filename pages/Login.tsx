
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  Phone, Lock, ArrowRight, ShieldCheck, 
  AlertCircle, GraduationCap, Github, 
  Globe, LayoutDashboard
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
    if (err) setError("عذراً، بيانات الدخول غير صحيحة.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Cairo'] relative overflow-hidden">
       
       {/* Left Panel: Aesthetic Image/Content */}
       <div className="hidden md:flex md:w-1/2 bg-slate-900 relative p-20 flex-col justify-between overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
             <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-2xl">
                <LayoutDashboard size={32} />
             </div>
             <h2 className="text-3xl font-black text-white tracking-tighter">SUMMIT <span className="text-indigo-400">PRO</span></h2>
          </div>

          <div className="relative z-10">
             <h3 className="text-6xl font-black text-white mb-8 leading-[1.1]">الذكاء في <br/> <span className="text-indigo-500">إدارة التعليم</span></h3>
             <p className="text-slate-400 text-xl font-medium max-w-md leading-relaxed">
               انضم إلى آلاف المعلمين الذين يثقون في نظام القمة لإدارة عملياتهم اليومية بدقة واحترافية.
             </p>
          </div>

          <div className="relative z-10 flex items-center gap-8">
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white">4.5</span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">إصدار النظام</span>
             </div>
             <div className="w-px h-10 bg-slate-800"></div>
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white">+5k</span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">مستخدم نشط</span>
             </div>
          </div>

          {/* Abstract Decorations */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-rose-500/20 blur-[100px] rounded-full"></div>
          <div className="absolute top-[20%] left-[-10%] w-40 h-40 border border-white/5 rounded-full animate-pulse"></div>
       </div>

       {/* Right Panel: Login Form */}
       <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 bg-[#F8FAFC]">
          <div className="w-full max-w-md space-y-12">
             
             <div className="text-center md:text-right">
                <h1 className="text-4xl font-black text-slate-900 mb-4">تسجيل الدخول</h1>
                <p className="text-slate-400 font-bold">مرحباً بك مجدداً في نظام القمة، يرجى إدخال بياناتك.</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-600 text-sm font-black animate-in shake duration-300">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                <div className="space-y-3">
                   <label className="text-sm font-black text-slate-700 mr-2">رقم الهاتف</label>
                   <div className="relative group">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                        required
                        placeholder="أدخل رقم هاتفك المسجل" 
                        className="w-full pr-14 pl-6 py-5 bg-white border border-slate-200 rounded-3xl font-bold focus:ring-4 ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-right shadow-sm"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-black text-slate-700 mr-2">كلمة المرور</label>
                   <div className="relative group">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                        required
                        type="password"
                        placeholder="••••••••" 
                        className="w-full pr-14 pl-6 py-5 bg-white border border-slate-200 rounded-3xl font-bold focus:ring-4 ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-right shadow-sm"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                   </div>
                </div>

                <div className="flex items-center justify-between px-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-bold text-slate-500">تذكرني</span>
                   </label>
                   <button type="button" className="text-sm font-black text-indigo-600 hover:text-indigo-700">نسيت كلمة المرور؟</button>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? 'جاري التحقق...' : 'دخول النظام'} <ArrowRight size={20} />
                </button>
             </form>

             <div className="flex items-center gap-4 pt-10">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">بواسطة ايهاب غزال</span>
                <div className="flex-1 h-px bg-slate-200"></div>
             </div>

             <div className="flex justify-center gap-4">
                <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg">
                   <Github size={20} />
                </button>
                <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg">
                   <Globe size={20} />
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Login;
