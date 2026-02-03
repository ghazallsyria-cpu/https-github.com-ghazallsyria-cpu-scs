
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { ShieldCheck, Mail, Calendar, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Teachers = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

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
        .neq('role', 'admin') // لا تظهر المدراء في القائمة لحمايتهم من الحذف بالخطأ
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
      // الحذف من جدول البروفايلات (سيؤدي لحذف التوابع بسبب CASCADE في SQL)
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة طلبات المعلمين</h1>
          <p className="text-slate-500 font-bold mt-1">يمكنك هنا قبول أو رفض طلبات الانضمام والتحكم في صلاحيات المعلمين.</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl border border-amber-100 flex items-center gap-3 font-black animate-bounce">
            <AlertCircle size={20} /> هناك {pendingCount} طلب بانتظار الموافقة!
          </div>
        )}
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

              {!t.is_approved && (
                <div className="absolute top-4 left-4">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                </div>
              )}
            </div>
          ))}
          {teachers.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
              <ShieldCheck size={64} className="mx-auto mb-6 text-slate-200" />
              <h3 className="text-xl font-black text-slate-400">لا يوجد معلمون مسجلون بعد.</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teachers;
