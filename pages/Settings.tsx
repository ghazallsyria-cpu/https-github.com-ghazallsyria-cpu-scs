
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Lock, Save, RefreshCw, Trash2, 
  AlertTriangle, ShieldAlert, Database, 
  UserX, Eraser, CheckCircle
} from 'lucide-react';

const Settings = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [resetConfirm, setResetConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const updatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert(error.message);
    else {
      setSuccessMsg("تم تحديث كلمة المرور بنجاح.");
      setPassword('');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    setLoading(false);
  };

  const handleSystemReset = async (type: 'all' | 'data_only') => {
    setLoading(true);
    try {
      // مسح البيانات الأساسية
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (type === 'all') {
        // مسح كافة المعلمين وأولياء الأمور (الحفاظ على المدير فقط)
        await supabase.from('profiles').delete().neq('role', 'admin');
      }

      setSuccessMsg("تم تصفير النظام بنجاح.");
      setResetConfirm(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      alert("خطأ أثناء التصفير: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in fade-in duration-500">
       <div className="flex items-center gap-6 mb-10">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><Lock size={32} /></div>
          <div>
             <h1 className="text-4xl font-black">إعدادات <span className="text-indigo-600">الحساب</span></h1>
             <p className="text-slate-400 font-bold">إدارة أمن الحساب والتحكم في النظام.</p>
          </div>
       </div>

       {successMsg && (
         <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4 text-emerald-600 font-black animate-bounce">
            <CheckCircle /> {successMsg}
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* تغيير كلمة المرور */}
          <form onSubmit={updatePass} className="bg-white p-12 rounded-[3.5rem] border shadow-sm space-y-8 relative overflow-hidden">
             <h2 className="text-2xl font-black flex items-center gap-3"><ShieldAlert className="text-indigo-600" /> تأمين الحساب</h2>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-500">كلمة المرور الجديدة</label>
                   <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold focus:ring-2 ring-indigo-100 outline-none transition-all" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                   />
                </div>
             </div>
             <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                {loading ? <RefreshCw className="animate-spin" /> : <Save />} حفظ التغييرات
             </button>
          </form>

          {/* معلومات الحساب */}
          <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-indigo-200 font-black text-xs uppercase tracking-widest mb-2">رتبة الحساب</p>
                <h3 className="text-4xl font-black mb-8">{profile?.role === 'admin' ? 'مدير النظام العام' : 'معلم معتمد'}</h3>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-white/10 pb-4">
                      <span className="text-indigo-200 font-bold">الاسم:</span>
                      <span className="font-black">{profile?.full_name}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/10 pb-4">
                      <span className="text-indigo-200 font-bold">الهاتف:</span>
                      <span className="font-black">{profile?.phone}</span>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>
       </div>

       {/* منطقة الخطر - للمدير فقط */}
       {isAdmin && (
         <div className="bg-rose-50 border-2 border-dashed border-rose-200 p-12 rounded-[4rem] space-y-8 animate-in slide-in-from-bottom-8">
            <div className="flex items-center gap-6">
               <div className="bg-rose-600 p-4 rounded-2xl text-white shadow-lg"><Database size={28} /></div>
               <div>
                  <h2 className="text-3xl font-black text-rose-900">منطقة الخطر (إدارة البيانات)</h2>
                  <p className="text-rose-500 font-bold">عمليات المسح الشامل لا يمكن التراجع عنها، يرجى الحذر.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button 
                onClick={() => setResetConfirm('data_only')}
                className="bg-white p-8 rounded-[2.5rem] border-2 border-rose-100 hover:border-rose-500 transition-all text-right group"
               >
                  <Eraser className="text-rose-400 mb-4 group-hover:rotate-12 transition-transform" size={32} />
                  <h4 className="text-xl font-black text-slate-900 mb-2">تصفير كافة البيانات</h4>
                  <p className="text-slate-400 font-bold text-sm">حذف كافة الطلاب والحصص والدفعات والجداول مع الحفاظ على حسابات المعلمين.</p>
               </button>

               <button 
                onClick={() => setResetConfirm('all')}
                className="bg-white p-8 rounded-[2.5rem] border-2 border-rose-100 hover:border-rose-500 transition-all text-right group"
               >
                  <UserX className="text-rose-600 mb-4 group-hover:scale-110 transition-transform" size={32} />
                  <h4 className="text-xl font-black text-rose-600 mb-2">تصفير النظام بالكامل</h4>
                  <p className="text-slate-400 font-bold text-sm">مسح شامل لكافة الجداول وحذف كافة المعلمين وأولياء الأمور (باستثناء حسابك).</p>
               </button>
            </div>
         </div>
       )}

       {/* مودال تأكيد المسح */}
       {resetConfirm && (
         <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-2xl">
            <div className="bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
               <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <AlertTriangle size={48} />
               </div>
               <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">هل أنت متأكد تماماً؟</h3>
                  <p className="text-slate-500 font-bold">
                     سيتم {resetConfirm === 'all' ? 'مسح النظام بالكامل والحسابات' : 'مسح كافة سجلات الطلاب والمالية'}. لا يمكن استعادة هذه البيانات لاحقاً.
                  </p>
               </div>
               <div className="flex flex-col gap-3">
                  <button 
                   onClick={() => handleSystemReset(resetConfirm as any)}
                   disabled={loading}
                   className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-rose-100 disabled:opacity-50"
                  >
                     {loading ? 'جاري التنفيذ...' : 'نعم، قم بالمسح النهائي'}
                  </button>
                  <button 
                   onClick={() => setResetConfirm(null)}
                   className="w-full py-5 text-slate-400 font-black hover:bg-slate-50 rounded-2xl transition-all"
                  >
                     إلغاء التراجع
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default Settings;
