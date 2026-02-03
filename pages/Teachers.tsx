
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { ShieldCheck, Calendar, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, UserPlus, X, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Teachers = ({ onSupervise }: { onSupervise: (teacher: {id: string, name: string} | null) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', mobile: '', password: '', gender: 'male' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  async function fetchTeachers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') 
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      showFeedback("فشل جلب قائمة المعلمين: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      showFeedback(currentStatus ? "تم إلغاء تفعيل حساب المعلم" : "تم تفعيل حساب المعلم بنجاح");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("حدث خطأ أثناء التحديث: " + err.message, 'error');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const isConfirmed = window.confirm(
      "تحذير: حذف المعلم سيؤدي لحذف كافة طلابه ودروسه ومدفوعاته نهائياً من النظام. هل أنت متأكد؟"
    );
    
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      showFeedback("تم حذف المعلم وكافة بياناته المرتبطة بنجاح");
      fetchTeachers();
    } catch (err: any) {
      console.error("Delete error:", err);
      showFeedback("فشل الحذف: قد لا تملك الصلاحية الكافية أو هناك خلل في الاتصال.", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleAddTeacherManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const virtualEmail = `${addForm.mobile.trim()}@system.local`;
      
      // ملاحظة: إنشاء حساب Auth من طرف العميل كمدير يتطلب عادة "Admin Auth API" (Service Role)
      // لكننا سنستخدم طريقة التسجيل العادية، مع توضيح للمدير أنه سيتم إنشاء الحساب
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: addForm.password,
        options: { data: { full_name: addForm.fullName } }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // تحديث البروفايل فوراً ليكون مفعلاً ومعلما
        const { error: profileError } = await supabase.from('profiles').update({
          full_name: addForm.fullName,
          phone: addForm.mobile,
          gender: addForm.gender,
          role: 'teacher',
          is_approved: true
        }).eq('id', data.user.id);

        if (profileError) throw profileError;

        showFeedback("تم إضافة المعلم وتفعيل حسابه يدوياً بنجاح");
        setIsAddModalOpen(false);
        setAddForm({ fullName: '', mobile: '', password: '', gender: 'male' });
        fetchTeachers();
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSupervise = (t: any) => {
    onSupervise({ id: t.id, name: t.full_name });
    navigate('/'); // العودة للرئيسية لمشاهدة بيانات المعلم
  };

  const pendingCount = teachers.filter(t => !t.is_approved).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all animate-in slide-in-from-top-full ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المعلمين</h1>
          <p className="text-slate-500 font-bold mt-1">التحكم الكامل في حسابات المعلمين، مراجعة طلباتهم، أو الدخول للإشراف على بياناتهم.</p>
        </div>
        <div className="flex gap-4">
          {pendingCount > 0 && (
            <div className="hidden lg:flex bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl border border-amber-100 items-center gap-3 font-black animate-pulse">
              <AlertCircle size={20} /> {pendingCount} طلب انتظار
            </div>
          )}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <UserPlus size={20} /> إضافة معلم يدوياً
          </button>
        </div>
      </div>

      {loading && teachers.length === 0 ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-8 rounded-[2.5rem] border transition-all relative group ${t.is_approved ? 'border-slate-200' : 'border-amber-200 shadow-xl shadow-amber-50 ring-2 ring-amber-100'}`}>
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm ${t.gender === 'female' ? 'bg-pink-50 text-pink-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  <UserCircle size={36} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSupervise(t)}
                    className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm"
                    title="إشراف (عرض بيانات المعلم)"
                  ><Eye size={20} /></button>
                  
                  {!t.is_approved ? (
                      <button 
                        onClick={() => handleToggleApproval(t.id, t.is_approved)}
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"
                        title="موافقة وتفعيل الحساب"
                      ><CheckCircle size={20} /></button>
                  ) : (
                      <button 
                        onClick={() => handleToggleApproval(t.id, t.is_approved)}
                        className="p-3 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl transition-all shadow-sm"
                        title="إلغاء التفعيل"
                      ><XCircle size={20} /></button>
                  )}
                  <button 
                    onClick={() => handleDeleteTeacher(t.id)}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"
                    title="حذف نهائي من النظام"
                  ><Trash2 size={20} /></button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-1">{t.full_name}</h3>
              <div className="flex items-center gap-4 mb-6">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${t.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {t.is_approved ? 'حساب نشط' : 'قيد المراجعة'}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {t.gender === 'female' ? 'أنثى' : 'ذكر'}
                </span>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                  <div className="bg-slate-50 p-2 rounded-xl text-indigo-400"><Phone size={16} /></div>
                  {t.phone || 'غير مسجل'}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                  <div className="bg-slate-50 p-2 rounded-xl text-indigo-400"><Calendar size={16} /></div>
                  انضم في: {new Date(t.created_at).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة إضافة معلم يدوياً */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddTeacherManual} className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><UserPlus size={24}/></div>
              <h2 className="text-2xl font-black text-slate-900">إضافة معلم جديد للمنظومة</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1"><User size={12}/> الاسم الكامل</label>
                <input required placeholder="مثال: د. أيمن خالد" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={addForm.fullName} onChange={e => setAddForm({...addForm, fullName: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1"><Phone size={12}/> رقم الموبايل (كاسم مستخدم)</label>
                <input required placeholder="09xxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left" value={addForm.mobile} onChange={e => setAddForm({...addForm, mobile: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1"><Lock size={12}/> كلمة المرور للحساب</label>
                <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">الجنس</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})}>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 mt-4">
                {loading ? "جاري إنشاء الحساب..." : "تأكيد إضافة المعلم وتفعيله"}
              </button>
              
              <p className="text-[10px] text-center text-slate-400 font-bold px-4 leading-relaxed">
                * عند الضغط على تأكيد، سيتم إنشاء حساب رسمي للمعلم مفعّل فوراً. يمكنه الدخول باستعمال رقم الموبايل وكلمة المرور المحددة.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Teachers;
