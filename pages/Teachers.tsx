
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, Plus, Copy, Check, RefreshCw, Edit3, Save, X
} from 'lucide-react';

const Teachers = ({ onSupervise }: { onSupervise: (teacher: {id: string, name: string} | null) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'codes'>('list');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') 
        .order('is_approved', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      showFeedback("فشل جلب قائمة المعلمين", 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*, used_profile:used_by(full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setActivationCodes(data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
    fetchCodes();
  }, [fetchTeachers, fetchCodes]);

  const handleOpenEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditForm({ full_name: teacher.full_name, phone: teacher.phone });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editForm.full_name, phone: editForm.phone })
        .eq('id', editingTeacher.id);
      
      if (error) throw error;
      showFeedback("تم تحديث بيانات المعلم بنجاح");
      setIsEditModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      showFeedback("خطأ في التحديث", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('تنبيه هام: حذف المعلم سيؤدي لحذف كافة الطلاب والحصص والمدفوعات المرتبطة به بشكل نهائي وغير قابل للاسترداد. هل أنت متأكد؟')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم حذف المعلم وكافة بياناته");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("فشل الحذف", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    const newCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    try {
      const { error } = await supabase.from('activation_codes').insert([{ code: newCode, used_by: null }]);
      if (error) throw error;
      showFeedback("تم توليد كود تفعيل جديد");
      fetchCodes();
    } catch (err: any) {
      showFeedback("فشل توليد الكود", 'error');
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: !currentStatus }).eq('id', id);
      if (error) throw error;
      showFeedback(currentStatus ? "تم تعليق الحساب" : "تم التفعيل");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("فشل تحديث الحالة", 'error');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-left duration-700 relative pb-20 text-right font-['Cairo'] overflow-x-hidden">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-4 lg:gap-6 relative z-10">
           <div className="bg-indigo-600 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] text-white shadow-2xl rotate-3 shrink-0">
             <ShieldCheck size={32} />
           </div>
           <div>
             <h1 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight">إدارة القوى العاملة</h1>
             <p className="text-slate-500 font-bold text-xs">التحكم الشامل في حسابات المعلمين وأمان النظام.</p>
           </div>
        </div>
        <button onClick={fetchTeachers} className="p-4 lg:p-5 bg-slate-50 text-slate-400 rounded-2xl lg:rounded-3xl hover:bg-slate-100 transition-all border border-slate-100 shrink-0">
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 p-1.5 bg-white rounded-[1.8rem] lg:rounded-[2.5rem] border border-slate-200 w-full sm:w-fit">
        <button onClick={() => setActiveTab('list')} className={`flex-1 sm:px-12 py-3.5 lg:py-4 rounded-[1.5rem] lg:rounded-[2rem] font-black text-[11px] lg:text-sm transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>المعلمون النشطون</button>
        <button onClick={() => setActiveTab('codes')} className={`flex-1 sm:px-12 py-3.5 lg:py-4 rounded-[1.5rem] lg:rounded-[2rem] font-black text-[11px] lg:text-sm transition-all ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>سجل الأكواد</button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border-2 transition-all group relative overflow-hidden ${t.is_approved ? 'border-slate-100 hover:border-indigo-500' : 'border-amber-200 bg-amber-50/20'}`}>
              <div className="flex justify-between items-start mb-6 lg:mb-8">
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center shadow-inner shrink-0 ${t.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-indigo-100 text-indigo-500'}`}>
                  <UserCircle size={40} />
                </div>
                <div className="flex flex-col gap-2 scale-90 md:opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                  <div className="flex gap-2">
                    <button onClick={() => onSupervise({ id: t.id, name: t.full_name })} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 shadow-sm" title="دخول بوضع الإشراف"><Eye size={16} /></button>
                    <button onClick={() => handleOpenEdit(t)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white shadow-sm"><Edit3 size={16} /></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className={`p-2.5 rounded-xl transition-all ${t.is_approved ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {t.is_approved ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white shadow-sm"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900 truncate">{t.full_name}</h3>
              <div className="flex items-center gap-2 mt-1.5 text-slate-400 font-bold text-xs">
                <Phone size={12}/> {t.phone}
              </div>
              <div className="mt-6 lg:mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-3 lg:px-4 py-1.5 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${t.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                  {t.is_approved ? 'حساب نشط' : 'بانتظار التفعيل'}
                </span>
                <span className="text-[9px] lg:text-[10px] font-bold text-slate-300">مدرس مسجل</span>
              </div>
            </div>
          ))}
          {!loading && teachers.length === 0 && (
             <div className="col-span-full py-20 text-center text-slate-400 font-black text-lg italic bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100">لا يوجد معلمون مسجلون حالياً.</div>
          )}
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
            <div className="text-center md:text-right">
              <h3 className="text-lg lg:text-xl font-black">نظام توليد الأكواد</h3>
              <p className="text-[10px] lg:text-xs text-slate-400 font-bold">أنشئ أكواداً فريدة لتفعيل حسابات المعلمين الجدد يدوياً.</p>
            </div>
            <button onClick={handleGenerateCode} className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 lg:py-5 rounded-[1.5rem] lg:rounded-[2.5rem] font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl text-sm">
              <Plus size={20} /> توليد كود جديد
            </button>
          </div>
          <div className="bg-white rounded-[2rem] lg:rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[600px]">
                <thead className="bg-slate-50 text-[9px] lg:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="p-6 lg:p-8">الكود الفريد</th>
                    <th className="p-6 lg:p-8">حالة الكود</th>
                    <th className="p-6 lg:p-8">صاحب الحساب</th>
                    <th className="p-6 lg:p-8 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activationCodes.map(code => (
                    <tr key={code.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 lg:p-8 font-black text-lg lg:text-xl tracking-[0.25em] text-slate-900">{code.code}</td>
                      <td className="p-6 lg:p-8">
                        <span className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[8px] lg:text-[10px] font-black tracking-widest ${code.is_used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                          {code.is_used ? 'مستخدم' : 'متاح للتفعيل'}
                        </span>
                      </td>
                      <td className="p-6 lg:p-8 font-bold text-slate-600 text-xs lg:text-sm">{code.used_profile?.full_name || '-'}</td>
                      <td className="p-6 lg:p-8 text-center">
                        <button onClick={() => copyToClipboard(code.code)} className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all shadow-sm ${copiedCode === code.code ? 'bg-emerald-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:scale-110'}`}>
                          {copiedCode === code.code ? <Check size={18}/> : <Copy size={18}/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleUpdateTeacher} className="bg-white w-full max-w-md p-8 lg:p-12 rounded-[3rem] lg:rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300 text-right overflow-y-auto max-h-[90vh]">
             <button type="button" onClick={() => setIsEditModalOpen(false)} className="absolute top-8 left-8 lg:top-12 lg:left-12 text-slate-300 hover:text-rose-500"><X size={28}/></button>
             <h2 className="text-xl lg:text-2xl font-black mb-8 lg:mb-10 text-slate-900">تعديل حساب المعلم</h2>
             <div className="space-y-4 lg:space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 mr-4 uppercase">الاسم بالكامل</label>
                  <input required className="w-full p-4 lg:p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] lg:rounded-[2rem] font-black focus:bg-white focus:border-indigo-500 outline-none transition-all text-xs" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 mr-4 uppercase">رقم الهاتف</label>
                  <input required className="w-full p-4 lg:p-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] lg:rounded-[2rem] font-black focus:bg-white focus:border-indigo-500 outline-none transition-all text-left text-xs" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-5 lg:py-6 bg-indigo-600 text-white font-black rounded-[1.8rem] lg:rounded-[2.5rem] shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 text-sm lg:text-lg mt-2">
                  <Save size={20}/> حفظ التغييرات
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Teachers;
