
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle } from 'lucide-react';

const ADMIN_PHONE = '55315661';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. تطهير رقم الهاتف فوراً
    const mobileClean = formData.mobile.replace(/\D/g, '');
    if (mobileClean.length < 8) {
      setError("يرجى إدخال رقم هاتف صحيح");
      setLoading(false);
      return;
    }

    const virtualEmail = `${mobileClean}@summit.edu`.toLowerCase();
    // إذا لم يدخل كلمة سر، نفترض أنها رقم الهاتف (الحالة الافتراضية لأولياء الأمور)
    const loginPassword = formData.password.trim() || mobileClean;

    try {
      if (isSignUp) {
        // منطق المعلم الجديد
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: loginPassword,
          options: { data: { phone: mobileClean, full_name: formData.fullName } }
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          await ensureProfileExists(authData.user.id, mobileClean, formData.fullName, 'teacher');
          setIsSignUp(false);
          setError("تم تقديم طلبك بنجاح. يرجى الانتظار حتى يتم تفعيل حسابك.");
        }
      } else {
        // محاولة تسجيل الدخول مباشرة
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: loginPassword
        });

        if (!signInError) {
          window.location.reload();
          return;
        }

        // إذا فشل الدخول العادي، نتحقق بذكاء: هل هو ولي أمر؟
        const { data: parentCheck } = await supabase.rpc('check_parent_phone', { phone_to_check: mobileClean });

        if (parentCheck && parentCheck.length > 0) {
          const studentName = parentCheck[0].student_name;
          
          // محاولة إنشاء حساب "صامت" لولي الأمر إذا لم يكن موجوداً
          const { data: autoUser, error: autoError } = await supabase.auth.signUp({
            email: virtualEmail,
            password: mobileClean, // كلمة السر هي الرقم
            options: { data: { phone: mobileClean, full_name: `ولي أمر ${studentName}` } }
          });

          if (autoError) {
            // إذا كان مسجلاً بالفعل، نحاول الدخول بكلمة السر الافتراضية (الرقم)
            // في حال كان المستخدم قد نسي أنه مسجل أو نسي كلمة السر
            const { error: finalTryError } = await supabase.auth.signInWithPassword({
              email: virtualEmail,
              password: mobileClean
            });
            
            if (finalTryError) {
              throw new Error("بيانات الدخول غير صحيحة. يرجى استخدام رقم هاتفك ككلمة سر.");
            }
          } else if (autoUser.user) {
            await ensureProfileExists(autoUser.user.id, mobileClean, `ولي أمر ${studentName}`, 'parent');
            await supabase.auth.signInWithPassword({ email: virtualEmail, password: mobileClean });
          }
          window.location.reload();
          return;
        }

        throw new Error("بيانات الدخول غير صحيحة أو الرقم غير مسجل في النظام.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ensureProfileExists = async (userId: string, phone: string, name: string, role: string) => {
    const isAdmin = phone === ADMIN_PHONE;
    await supabase.from('profiles').upsert([{
      id: userId,
      full_name: name,
      phone: phone,
      role: isAdmin ? 'admin' : role,
      is_approved: true
    }]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-['Cairo'] text-right" dir="rtl">
      <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 rounded-3xl bg-indigo-600 text-white mb-6 shadow-xl">
            <GraduationCap size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">منصة القمة التعليمية</h2>
          <p className="text-slate-400 font-bold mt-1">بوابة الدخول الذكية</p>
        </div>

        {error && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-black border flex items-center gap-3 ${error.includes("بنجاح") ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">الاسم الكامل</label>
              <input required placeholder="الاسم الثلاثي..." className="w-full p-4 bg-slate-50 border rounded-2xl font-black outline-none focus:bg-white focus:border-indigo-600 transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">رقم الهاتف</label>
             <div className="relative">
               <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input required type="tel" placeholder="أدخل رقمك المسجل..." className="w-full p-4 pr-12 bg-slate-50 border rounded-2xl font-black text-left outline-none focus:bg-white focus:border-indigo-600 transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">كلمة المرور</label>
             <div className="relative">
               <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input type="password" placeholder="••••••••" className="w-full p-4 pr-12 bg-slate-50 border rounded-2xl font-black text-left outline-none focus:bg-white focus:border-indigo-600 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
             {!isSignUp && <p className="text-[9px] text-slate-400 font-bold mt-2 mr-4">💡 لولي الأمر: إذا لم تكن تعرف كلمة سرك، استخدم رقم هاتفك.</p>}
          </div>

          <button disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تسجيل جديد' : 'دخول سريع')}
          </button>
        </form>

        <div className="mt-8 flex justify-center">
           <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-black text-xs hover:underline">
             {isSignUp ? 'العودة لصفحة الدخول' : 'هل أنت معلم جديد؟ سجل هنا'}
           </button>
        </div>
      </div>
      <p className="mt-8 text-slate-400 font-black text-[10px] uppercase">Summit System © 2025</p>
    </div>
  );
};

export default Login;
