
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  Phone, Lock, ArrowRight, ShieldCheck, 
  AlertCircle, GraduationCap, LayoutDashboard, 
  UserPlus, LogIn, UserCheck, ShieldAlert, Book
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

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const email = `${phone}@summit.com`;

    if (isRegister) {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: userRole,
            subjects: userRole === 'teacher' ? subjects : 'بوابة ولي أمر'
          }
        }
      });

      if (err) {
        setError(err.message === "User already registered" ? "هذا الهاتف مسجل مسبقاً." : "فشل التسجيل، يرجى التحقق من البيانات.");
      } else {
        setSuccess("تم إنشاء الحساب بنجاح! انتظر تفعيل الإدارة إذا كنت معلماً.");
        if (userRole === 'parent') setTimeout(() => setIsRegister(false), 2000);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("عذراً، بيانات الدخول غير صحيحة.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Cairo'] relative overflow-hidden">
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
               {isRegister ? "ابدأ رحلتك التعليمية اليوم مع أقوى نظام إداري." : "انضم إلى آلاف المعلمين الذين يثقون في نظام القمة."}
             </p>
          </div>
          <div className="relative z-10 flex items-center gap-8 text-white/50 text-sm font-bold">
             <div className="flex items-center gap-2"><UserCheck size={18}/> أمان عالي</div>
             <div className="flex items-center gap-2"><ShieldAlert size={18}/> خصوصية تامة</div>
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full"></div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 bg-[#F8FAFC]">
          <div className="w-full max-w-md space-y-10">
             <div className="bg-slate-100 p-1.5 rounded-3xl flex items-center gap-2">
                <button onClick={() => setIsRegister(false)} className={`flex-1 py-4 rounded-2xl font-black transition-all ${!isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>دخول</button>
                <button onClick={() => setIsRegister(true)} className={`flex-1 py-4 rounded-2xl font-black transition-all ${isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>تسجيل</button>
             </div>

             <form onSubmit={handleAction} className="space-y-5">
                {error && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-black"><AlertCircle size={20} /> {error}</div>}
                {success && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-black"><ShieldCheck size={20} /> {success}</div>}

                {isRegister && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700">الاسم الكامل</label>
                       <input required placeholder="الاسم الثلاثي" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700">نوع الحساب</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setUserRole('teacher')} className={`py-3 rounded-2xl border-2 font-black ${userRole === 'teacher' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}>معلم</button>
                          <button type="button" onClick={() => setUserRole('parent')} className={`py-3 rounded-2xl border-2 font-black ${userRole === 'parent' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}>ولي أمر</button>
                       </div>
                    </div>
                    {userRole === 'teacher' && (
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">المواد التي تدرسها</label>
                        <div className="relative group">
                          <Book className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input required placeholder="مثل: فيزياء، كيمياء" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={subjects} onChange={e => setSubjects(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">رقم الهاتف</label>
                   <div className="relative group">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input required placeholder="90000000" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={phone} onChange={e => setPhone(e.target.value)} />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">كلمة المرور</label>
                   <div className="relative group">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input required type="password" placeholder="••••••••" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={password} onChange={e => setPassword(e.target.value)} />
                   </div>
                </div>

                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 mt-4">
                  {loading ? 'جاري المعالجة...' : (isRegister ? 'إنشاء حساب جديد' : 'دخول النظام')} <ArrowRight size={20} />
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};

export default Login;
