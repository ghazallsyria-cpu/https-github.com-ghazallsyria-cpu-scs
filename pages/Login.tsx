
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

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
    if (mobileClean.length < 8) {
      setError("يرجى إدخال رقم هاتف صحيح");
      setLoading(false);
      return;
    }

    const isAdminNumber = mobileClean === ADMIN_PHONE;
    const virtualEmail = `${mobileClean}@system.local`;

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("كلمات المرور غير متطابقة");
        }
        
        // محاولة إنشاء الحساب
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: {
            data: { 
              phone: mobileClean,
              full_name: formData.fullName
            }
          }
        });

        // معالجة حالة المستخدم المسجل مسبقاً في نظام Auth ولكن ليس في Profiles
        if (signUpError) {
          if (signUpError.message.includes("already registered") || signUpError.status === 422) {
             // إذا كان مسجلاً مسبقاً، نحاول تسجيل الدخول للتأكد من امتلاكه الحساب ثم ننشئ له بروفايل إذا نقص
             const { data: signInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
               email: virtualEmail,
               password: formData.password
             });

             if (retrySignInError) {
               throw new Error("هذا الرقم مسجل مسبقاً بكلمة مرور مختلفة. يرجى تجربة تسجيل الدخول أو التواصل مع الإدارة.");
             }

             if (signInData.user) {
               await ensureProfileExists(signInData.user.id, mobileClean, formData.fullName, isAdminNumber);
               return; // سيتم تحديث حالة App.tsx تلقائياً عبر المستمع
             }
          }
          throw signUpError;
        }
        
        if (authData.user) {
          await ensureProfileExists(authData.user.id, mobileClean, formData.fullName, isAdminNumber);
          setIsSignUp(false);
          alert(isAdminNumber ? "تم إنشاء حساب الإدارة بنجاح" : "تم إرسال طلب الانضمام، بانتظار موافقة الإدارة المركزية.");
        }
      } else {
        // تسجيل الدخول العادي
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        
        if (signInError) {
          throw new Error("بيانات الدخول غير صحيحة، يرجى مراجعة رقم الهاتف أو كلمة السر.");
        }

        // التأكد من وجود بروفايل حتى عند تسجيل الدخول (لحالات الخلل السابقة)
        if (signInData.user) {
          await ensureProfileExists(signInData.user.id, mobileClean, signInData.user.user_metadata?.full_name || 'معلم جديد', isAdminNumber);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // دالة مساعدة لضمان وجود السجل في جدول profiles
  const ensureProfileExists = async (userId: string, phone: string, name: string, isAdmin: boolean) => {
    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    
    if (!existingProfile) {
      const { error: profileError } = await supabase.from('profiles').upsert([{
        id: userId,
        full_name: name,
        phone: phone,
        role: isAdmin ? 'admin' : 'teacher',
        is_approved: isAdmin ? true : false 
      }]);
      if (profileError) console.error("Profile linking error:", profileError);
    } else if (isAdmin) {
      // تحديث صلاحية المدير إذا كان الرقم هو الرقم الذهبي
      await supabase.from('profiles').update({ role: 'admin', is_approved: true }).eq('id', userId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-['Cairo'] text-right" dir="rtl">
      
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[150px]"></div>
      </div>

      <div className="bg-white w-full max-w-xl p-10 lg:p-16 rounded-[4rem] shadow-2xl relative z-10 border border-white/80 overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-full h-2.5 bg-gradient-to-l from-indigo-700 to-indigo-500"></div>
        
        <div className="flex flex-col items-center mb-12">
          <div className="bg-gradient-to-tr from-indigo-700 to-indigo-500 p-6 rounded-[2.2rem] text-white mb-8 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700">
            <GraduationCap size={56} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight text-center">
            {isSignUp ? 'عضوية جديدة' : 'بوابة المنصة الرقمية'}
            <br/>
            <span className="text-indigo-600 text-[10px] font-black tracking-[0.4em] uppercase mt-4 block">SUMMIT MANAGEMENT SYSTEM</span>
          </h2>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-6 rounded-[1.8rem] mb-10 text-xs font-black border border-rose-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" /> 
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم بالكامل</label>
              <input required placeholder="الاسم الثلاثي..." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] font-black outline-none focus:bg-white focus:border-indigo-100 transition-all text-sm" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          
          <div className="space-y-2">
             <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest block">رقم الهاتف المسجل</label>
             <div className="relative">
               <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input required type="tel" placeholder="00000000" className="w-full p-5 pr-16 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all tracking-widest text-base" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest block">كلمة المرور</label>
             <div className="relative">
               <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input required type="password" placeholder="••••••••" className="w-full p-5 pr-16 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all text-base" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
               <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest block">تأكيد كلمة المرور</label>
               <div className="relative">
                 <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input required type="password" placeholder="••••••••" className="w-full p-5 pr-16 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] font-black text-left outline-none focus:bg-white focus:border-indigo-100 transition-all text-base" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
               </div>
            </div>
          )}
          
          <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 text-lg mt-4">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? <><Sparkles size={20}/> تسجيل الحساب</> : 'دخول المنصة')}
          </button>
        </form>

        <div className="flex flex-col items-center mt-12 gap-4">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] hover:text-indigo-600 transition-all duration-300">
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'طلب انضمام لمعلم جديد'}
          </button>
          {!isSignUp && (
            <p className="text-[9px] text-slate-300 font-bold max-w-xs text-center leading-relaxed">
              * في حال نسيان كلمة المرور، يرجى التواصل مع المدير العام لإعادة تعيين حسابك.
            </p>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] relative z-10 opacity-50">© 2025 SUMMIT EDUCATION CORE</p>
    </div>
  );
};

export default Login;
