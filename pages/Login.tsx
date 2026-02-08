
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  Phone, Lock, ArrowRight, ShieldCheck, 
  AlertCircle, GraduationCap, LayoutDashboard, 
  UserPlus, LogIn, UserCheck, ShieldAlert, Book, Eye, EyeOff
} from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [subjects, setSubjects] = useState('');
  const [userRole, setUserRole] = useState<'teacher' | 'parent'>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
       setError("يرجى إدخال رقم هاتف صحيح.");
       setLoading(false);
       return;
    }

    const email = `${cleanPhone}@summit.com`;

    if (isRegister) {
      if (!fullName.trim()) { setError("الاسم الكامل مطلوب."); setLoading(false); return; }
      
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: cleanPhone,
            role: userRole,
            subjects: userRole === 'teacher' ? subjects.trim() : 'بوابة ولي أمر'
          }
        }
      });

      if (err) {
        console.error("Signup Error:", err);
        if (err.message.includes("already registered") || err.status === 422) {
          setError("عذراً، هذا الرقم مسجل مسبقاً في النظام.");
        } else if (err.message.includes("Email confirmations")) {
          setError("يجب إيقاف خيار 'Confirm Email' من إعدادات Supabase ليعمل النظام.");
        } else {
          setError(err.message || "فشل التسجيل، يرجى المحاولة لاحقاً.");
        }
      } else {
        setSuccess("تم إنشاء الحساب بنجاح! جاري توجيهك...");
        // تسجيل الدخول التلقائي بعد التسجيل إذا كان ولي أمر
        if (userRole === 'parent') {
           setTimeout(() => window.location.reload(), 1500);
        } else {
           setSuccess("تم التسجيل! بانتظار تفعيل الإدارة لحسابك كمعلم.");
        }
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        console.error("Login Error:", err);
        setError("بيانات الدخول غير صحيحة، أو الحساب غير مفعل.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Cairo'] relative overflow-hidden">
       {/* Left Brand Side */}
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
               نظام رقمي متكامل يجمع بين المعلم وولي الأمر في منصة واحدة فائقة السرعة.
             </p>
          </div>
          <div className="relative z-10 flex items-center gap-8 text-white/50 text-sm font-bold">
             <div className="flex items-center gap-2"><UserCheck size={18}/> تشفير كامل</div>
             <div className="flex items-center gap-2"><ShieldAlert size={18}/> نسخة V5.0</div>
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full"></div>
       </div>

       {/* Right Form Side */}
       <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 bg-[#F8FAFC]">
          <div className="w-full max-w-md space-y-10">
             <div className="text-center space-y-2">
                <h1 className="text-4xl font-black text-slate-900">{isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}</h1>
                <p className="text-slate-400 font-bold">مرحباً بك في منصة القمة التعليمية</p>
             </div>

             <div className="bg-slate-100 p-1.5 rounded-3xl flex items-center gap-2">
                <button onClick={() => { setIsRegister(false); setError(null); }} className={`flex-1 py-4 rounded-2xl font-black transition-all ${!isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>دخول</button>
                <button onClick={() => { setIsRegister(true); setError(null); }} className={`flex-1 py-4 rounded-2xl font-black transition-all ${isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>تسجيل</button>
             </div>

             <form onSubmit={handleAction} className="space-y-5">
                {error && <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-start gap-3 text-rose-600 text-sm font-black animate-bounce"><AlertCircle className="shrink-0" size={20} /> <span>{error}</span></div>}
                {success && <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-black"><ShieldCheck size={20} /> {success}</div>}

                {isRegister && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700">الاسم الكامل</label>
                       <input required placeholder="الاسم الثلاثي" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 ring-indigo-100 outline-none transition-all" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700">نوع الحساب</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setUserRole('teacher')} className={`py-3 rounded-2xl border-2 font-black transition-all ${userRole === 'teacher' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}>معلم</button>
                          <button type="button" onClick={() => setUserRole('parent')} className={`py-3 rounded-2xl border-2 font-black transition-all ${userRole === 'parent' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}>ولي أمر</button>
                       </div>
                    </div>
                    {userRole === 'teacher' && (
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">المواد</label>
                        <div className="relative group">
                          <Book className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input required placeholder="مثل: رياضيات، فيزياء" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 ring-indigo-100 outline-none" value={subjects} onChange={e => setSubjects(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">رقم الهاتف</label>
                   <div className="relative group">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input required type="tel" placeholder="90000000" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 ring-indigo-100 outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">كلمة المرور</label>
                   <div className="relative group">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input required type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full pr-14 pl-14 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 ring-indigo-100 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                         {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                   </div>
                </div>

                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4">
                  {loading ? 'جاري التحقق...' : (isRegister ? 'إتمام التسجيل' : 'دخول النظام')} <ArrowRight size={20} />
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};

export default Login;
