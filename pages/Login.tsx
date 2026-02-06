
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  Phone, Lock, ArrowRight, ShieldCheck, 
  AlertCircle, GraduationCap, Github, 
  Globe, LayoutDashboard, UserPlus, LogIn,
  UserCheck, ShieldAlert
} from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'teacher' | 'parent'>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const email = `${phone}@summit.com`;

    if (isRegister) {
      // منطق التسجيل
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: userRole
          }
        }
      });

      if (err) {
        setError(err.message === "User already registered" ? "هذا الهاتف مسجل مسبقاً." : "فشل التسجيل، يرجى التحقق من البيانات.");
      } else {
        setSuccess("تم إنشاء الحساب بنجاح! انتظر تفعيل الإدارة إذا كنت معلماً.");
        if (userRole === 'parent') {
           // أولياء الأمور يمكنهم الدخول فوراً في هذا النظام
           setTimeout(() => setIsRegister(false), 2000);
        }
      }
    } else {
      // منطق الدخول
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("عذراً، بيانات الدخول غير صحيحة.");
    }
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
               {isRegister 
                ? "ابدأ رحلتك التعليمية اليوم مع أقوى نظام إداري للمعلمين وأولياء الأمور."
                : "انضم إلى آلاف المعلمين الذين يثقون في نظام القمة لإدارة عملياتهم اليومية بدقة واحترافية."}
             </p>
          </div>

          <div className="relative z-10 flex items-center gap-8 text-white/50 text-sm font-bold">
             <div className="flex items-center gap-2"><UserCheck size={18}/> أمان عالي</div>
             <div className="flex items-center gap-2"><ShieldAlert size={18}/> خصوصية تامة</div>
          </div>

          {/* Abstract Decorations */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-rose-500/20 blur-[100px] rounded-full"></div>
       </div>

       {/* Right Panel: Login/Register Form */}
       <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 bg-[#F8FAFC]">
          <div className="w-full max-w-md space-y-10">
             
             {/* Tab Switcher */}
             <div className="bg-slate-100 p-1.5 rounded-3xl flex items-center gap-2">
                <button 
                  onClick={() => { setIsRegister(false); setError(null); }}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${!isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LogIn size={18} /> دخول
                </button>
                <button 
                  onClick={() => { setIsRegister(true); setError(null); }}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <UserPlus size={18} /> تسجيل
                </button>
             </div>

             <div className="text-center md:text-right">
                <h1 className="text-4xl font-black text-slate-900 mb-3">{isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}</h1>
                <p className="text-slate-400 font-bold">
                  {isRegister ? 'أدخل بياناتك للانضمام إلى منصة القمة' : 'مرحباً بك مجدداً، يرجى إدخال بياناتك.'}
                </p>
             </div>

             <form onSubmit={handleAction} className="space-y-5">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-black animate-in shake duration-300">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-black animate-in fade-in duration-300">
                    <ShieldCheck size={20} /> {success}
                  </div>
                )}

                {isRegister && (
                  <>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700 mr-2">الاسم الكامل</label>
                       <input 
                          required
                          placeholder="الاسم الثلاثي" 
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-right shadow-sm"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700 mr-2">نوع الحساب</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => setUserRole('teacher')}
                            className={`py-3 rounded-2xl border-2 font-black transition-all ${userRole === 'teacher' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}
                          >معلم</button>
                          <button 
                            type="button"
                            onClick={() => setUserRole('parent')}
                            className={`py-3 rounded-2xl border-2 font-black transition-all ${userRole === 'parent' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}
                          >ولي أمر</button>
                       </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700 mr-2">رقم الهاتف</label>
                   <div className="relative group">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                        required
                        placeholder="أدخل رقم الهاتف" 
                        className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-right shadow-sm"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700 mr-2">كلمة المرور</label>
                   <div className="relative group">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                        required
                        type="password"
                        placeholder="••••••••" 
                        className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-4 ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all text-right shadow-sm"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                   </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 mt-4"
                >
                  {loading ? 'جاري المعالجة...' : (isRegister ? 'إنشاء حساب جديد' : 'دخول النظام')} <ArrowRight size={20} />
                </button>
             </form>

             <div className="text-center">
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest pt-6 border-t border-slate-100">بواسطة ايهاب غزال</p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Login;
