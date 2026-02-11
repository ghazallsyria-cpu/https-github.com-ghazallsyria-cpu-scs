
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
  const [userRole, setUserRole] = useState<'teacher' | 'parent' | 'student'>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const email = `${phone.trim()}@summit.com`;

    if (isRegister) {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: userRole,
            is_approved: userRole !== 'teacher', // الطلاب والأهالي يتم تفعيلهم تلقائياً
            subjects: userRole === 'teacher' ? subjects.trim() : 'خدمات عامة'
          }
        }
      });

      if (err) setError(err.message);
      else {
        setSuccess("تم إنشاء الحساب بنجاح!");
        setTimeout(() => window.location.reload(), 1500);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("بيانات الدخول غير صحيحة، أو الحساب غير مفعل.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Cairo'] relative overflow-hidden">
       <div className="hidden md:flex md:w-1/2 bg-slate-900 relative p-20 flex-col justify-between overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
             <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-2xl"><LayoutDashboard size={32} /></div>
             <h2 className="text-3xl font-black text-white tracking-tighter">SUMMIT <span className="text-indigo-400">CONNECT</span></h2>
          </div>
          <div className="relative z-10 text-white">
             <h3 className="text-6xl font-black mb-8 leading-[1.1]">مستقبل <br/> <span className="text-indigo-500">التعلم الحر</span></h3>
             <p className="text-slate-400 text-xl font-medium max-w-md">الآن يمكنك طلب أفضل المعلمين المعتمدين بلمسة زر واحدة.</p>
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full"></div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 bg-[#F8FAFC]">
          <div className="w-full max-w-md space-y-8">
             <div className="text-center space-y-2">
                <h1 className="text-4xl font-black text-slate-900">{isRegister ? 'انضم إلينا' : 'تسجيل الدخول'}</h1>
                <p className="text-slate-400 font-bold">بوابة القمة V5.5</p>
             </div>

             <div className="bg-slate-100 p-1.5 rounded-3xl flex items-center gap-2">
                <button onClick={() => setIsRegister(false)} className={`flex-1 py-4 rounded-2xl font-black transition-all ${!isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>دخول</button>
                <button onClick={() => setIsRegister(true)} className={`flex-1 py-4 rounded-2xl font-black transition-all ${isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>تسجيل</button>
             </div>

             <form onSubmit={handleAction} className="space-y-5">
                {error && <div className="bg-rose-50 p-5 rounded-2xl text-rose-600 text-sm font-black animate-shake">{error}</div>}
                {success && <div className="bg-emerald-50 p-5 rounded-2xl text-emerald-600 text-sm font-black">{success}</div>}

                {isRegister && (
                  <div className="space-y-4">
                    <input required placeholder="الاسم بالكامل" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none" value={fullName} onChange={e => setFullName(e.target.value)} />
                    <div className="grid grid-cols-3 gap-2">
                       <button type="button" onClick={() => setUserRole('teacher')} className={`py-3 rounded-xl border-2 font-black text-[10px] ${userRole === 'teacher' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'}`}>معلم</button>
                       <button type="button" onClick={() => setUserRole('student')} className={`py-3 rounded-xl border-2 font-black text-[10px] ${userRole === 'student' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'}`}>طالب</button>
                       <button type="button" onClick={() => setUserRole('parent')} className={`py-3 rounded-xl border-2 font-black text-[10px] ${userRole === 'parent' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'}`}>ولي أمر</button>
                    </div>
                  </div>
                )}

                <div className="relative group">
                   <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input required type="tel" placeholder="رقم الهاتف" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                <div className="relative group">
                   <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input required type={showPass ? "text" : "password"} placeholder="كلمة المرور" className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                  {loading ? 'جاري التنفيذ...' : (isRegister ? 'إنشاء الحساب' : 'دخول النظام')} <ArrowRight size={20} />
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};

export default Login;
