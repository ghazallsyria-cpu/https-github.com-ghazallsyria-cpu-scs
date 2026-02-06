
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, ShieldCheck, Heart, AlertCircle, UserCheck, UserPlus } from 'lucide-react';

const ADMIN_PHONE = '55315661';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: '', confirmPassword: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.trim();
    // استخدام صيغة بريد إلكتروني موحدة تعتمد على رقم الهاتف فقط
    const virtualEmail = `${mobileClean}@summit.edu`; 
    
    // إذا كان تسجيل دخول، نتحقق هل هو ولي أمر؟
    // ولي الأمر كلمة سره الافتراضية هي رقم هاتفه إذا لم يكتب غير ذلك
    const loginPassword = formData.password || mobileClean;

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: { data: { phone: mobileClean, full_name: formData.fullName } }
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          await ensureProfileExists(authData.user.id, mobileClean, formData.fullName, 'teacher');
          setIsSignUp(false);
          setError("تم تقديم طلبك بنجاح. يرجى الانتظار حتى يتم تفعيل حسابك من الإدارة.");
        }
      } else {
        // محاولة تسجيل الدخول العادية
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: loginPassword
        });
        
        if (signInError) {
          // إذا فشل تسجيل الدخول، نتحقق هل هذا الرقم موجود في قاعدة سجلات الطلاب؟
          const { data: linkedParent, error: rpcError } = await supabase.rpc('check_parent_phone', { phone_to_check: mobileClean });
          
          if (linkedParent && linkedParent.length > 0) {
            // الرقم موجود كولي أمر، نقوم بإنشاء الحساب له الآن تلقائياً
            const { data: newParent, error: createError } = await supabase.auth.signUp({
              email: virtualEmail,
              password: mobileClean, // كلمة السر هي رقم الهاتف
              options: { data: { phone: mobileClean, full_name: `ولي أمر ${linkedParent[0].student_name}` } }
            });

            if (createError) {
               if (createError.message.includes("already registered")) {
                  throw new Error("بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف وكلمة السر.");
               }
               throw createError;
            }

            if (newParent.user) {
              await ensureProfileExists(newParent.user.id, mobileClean, `ولي أمر ${linkedParent[0].student_name}`, 'parent');
              // محاولة تسجيل دخول ثانية بعد الإنشاء التلقائي
              await supabase.auth.signInWithPassword({ email: virtualEmail, password: mobileClean });
              window.location.reload();
              return;
            }
          }
          throw new Error("عذراً، هذا الرقم غير مسجل في المنصة. يرجى التواصل مع الإدارة.");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ensureProfileExists = async (userId: string, phone: string, name: string, role: string) => {
    const isAdmin = phone === ADMIN_PHONE;
    const { error } = await supabase.from('profiles').upsert([{
      id: userId,
      full_name: name,
      phone: phone,
      role: isAdmin ? 'admin' : role,
      is_approved: true
    }]);
    if (error) console.error("Profile sync error:", error);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 lg:p-6 font-['Cairo'] text-right" dir="rtl">
      <div className="bg-white w-full max-w-xl p-8 md:p-14 rounded-[3.5rem] shadow-2xl relative z-10 border border-white/80 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col items-center mb-10">
          <div className="p-6 rounded-[2.2rem] bg-indigo-600 text-white mb-6 shadow-2xl">
            <GraduationCap size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 text-center">منصة القمة التعليمية</h2>
          <p className="text-slate-400 font-bold mt-2">تسجيل دخول المعلمين وأولياء الأمور</p>
        </div>

        {error && (
          <div className={`p-5 rounded-[1.5rem] mb-8 text-xs font-black border flex items-center gap-4 animate-in fade-in ${error.includes("بنجاح") ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الكامل</label>
              <input required placeholder="الاسم الثلاثي..." className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-black outline-none focus:bg-white focus:border-indigo-100 transition-all text-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">رقم الهاتف المسجل</label>
             <div className="relative">
               <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input required type="tel" placeholder="رقم الهاتف..." className="w-full p-4 pr-14 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all tracking-widest" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">كلمة المرور</label>
             <div className="relative">
               <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input required type="password" placeholder="••••••••" className="w-full p-4 pr-14 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
             {!isSignUp && <p className="text-[9px] text-slate-400 font-bold mt-2 mr-4">💡 ولي الأمر: أدخل رقم هاتفك في خانة كلمة المرور للدخول لأول مرة.</p>}
          </div>

          <button disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.8rem] font-black shadow-xl transition-all flex items-center justify-center gap-4 text-lg">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'تقديم طلب انضمام' : 'دخول المنصة')}
          </button>
        </form>

        <div className="mt-8 flex justify-center">
           <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 font-black text-xs hover:underline">
             {isSignUp ? 'لديك حساب؟ سجل دخولك' : 'معلم جديد؟ قدم طلب انضمام'}
           </button>
        </div>
      </div>
      <p className="mt-8 text-slate-400 font-black text-[10px] tracking-widest uppercase">Ehab Ghazzal System © 2025</p>
    </div>
  );
};

export default Login;
