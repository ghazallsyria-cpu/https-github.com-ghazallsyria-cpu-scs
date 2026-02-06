import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle, School, ChevronLeft, UserCircle, Briefcase, CheckCircle } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isParentMode, setIsParentMode] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{msg: string, type: 'error' | 'success'} | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: ''
  });

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const virtualEmail = `${formData.mobile}@summit.edu`.toLowerCase();
    try {
      if (isSignUp) {
        await supabase.auth.signUp({
          email: virtualEmail, password: formData.password,
          options: { data: { phone: formData.mobile, full_name: formData.fullName } }
        });
        setIsSignUp(false);
      } else {
        await supabase.auth.signInWithPassword({ email: virtualEmail, password: formData.password });
        window.location.reload();
      }
    } catch (err: any) { setError({ msg: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation of parent access
    localStorage.setItem('parent_session_phone', formData.mobile);
    localStorage.setItem('parent_student_name', 'طالب تجريبي');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-6 font-['Cairo']">
      <div className="bg-white w-full max-w-lg p-10 md:p-16 rounded-[4rem] shadow-2xl border">
        <div className="flex justify-center gap-4 mb-10">
           <button onClick={() => setIsParentMode(true)} className={`px-8 py-3 rounded-full font-black ${isParentMode ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>ولي أمر</button>
           <button onClick={() => setIsParentMode(false)} className={`px-8 py-3 rounded-full font-black ${!isParentMode ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>معلم</button>
        </div>
        <form onSubmit={isParentMode ? handleParentLogin : handleTeacherLogin} className="space-y-6">
           {!isParentMode && isSignUp && <input placeholder="الاسم" className="w-full p-6 bg-slate-50 rounded-[2rem]" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />}
           <input placeholder="رقم الهاتف" className="w-full p-6 bg-slate-50 rounded-[2rem]" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
           {!isParentMode && <input type="password" placeholder="كلمة المرور" className="w-full p-6 bg-slate-50 rounded-[2rem]" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />}
           <button className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black">{loading ? 'جاري...' : 'دخول'}</button>
           {!isParentMode && <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-xs text-indigo-600">{isSignUp ? 'لديك حساب؟' : 'سجل جديد'}</button>}
        </form>
      </div>
    </div>
  );
};

export default Login;