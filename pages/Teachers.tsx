import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, Plus, Copy, Check, RefreshCw, Edit3, Save, X, UserPlus, Star
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
    if (!confirm('تنبيه: سيتم حذف كافة سجلات هذا المعلم وطلابه نهائياً. هل أنت متأكد؟')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم حذف الحساب بنجاح");
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
      showFeedback("تم توليد كود تفعيل جديد بنجاح");
      fetchCodes();
    } catch (err: any) {
      showFeedback("فشل توليد الكود", 'error');
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: !currentStatus }).eq('id', id);
      if (error) throw error;
      showFeedback(currentStatus ? "تم تعطيل حساب المعلم" : "تم تنشيط حساب المعلم بنجاح");
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
    <div className="space-y-10 animate-in fade-in slide-in-from-right duration-700 pb-20 text-right font-['Cairo']">
      
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[150] px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          {feedback.msg}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-8 relative z-10">
           <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500">
             <ShieldCheck size={40} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 leading-tight">إدارة شؤون المعلمين</h1>
             <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">التحكم المركزي في حسابات وصلاحيات المنصة</p>
           </div>
        </div>
        <button onClick={fetchTeachers} className="bg-slate-50 text-slate-400 p-5 rounded-3xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 group-hover:scale-110">
          <RefreshCw size={28} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl w-full md:w-fit mx-auto">
        <button onClick={() => setActiveTab('list')} className={`flex-1 md:px-14 py-5 rounded-[2.5rem] font-black text-sm transition-all duration-500 ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}>قائمة المعلمين</button>
        <button onClick={() => setActiveTab('codes')} className={`flex-1 md:px-14 py-5 rounded-[2.5rem] font-black text-sm transition-all duration-500 ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}>أكواد التفعيل</button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-10 rounded-[4rem] border-2 transition-all duration-500 group relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 ${t.is_approved ? 'border-white hover:border-indigo-500' : 'border-amber-200 bg-amber-50/10'}`}>
              <div className="flex justify-between items-start mb-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner shrink-0 ${t.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-indigo-100 text-indigo-500'}`}>
                  <UserCircle size={44} />
                </div>
                <div className="flex flex-col gap-3 md:opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                  <div className="flex gap-2">
                    <button onClick={() => onSupervise({ id: t.id, name: t.full_name })} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg" title="دخول بوضع الرقابة"><Eye size={18} /></button>
                    <button onClick={() => handleOpenEdit(t)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg"><Edit3 size={18} /></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className={`p-3 rounded-xl transition-all shadow-lg ${t.is_approved ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {t.is_approved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{t.full_name}</h3>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Phone size={14}/> {t.phone}
              </div>
              <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${t.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                  {t.is_approved ? 'حساب مفعل' : 'بانتظار الموافقة'}
                </span>
                <Star size={18} className={t.is_approved ? 'text-amber-400' : 'text-slate-200'} fill={t.is_approved ? 'currentColor' : 'none'} />
              </div>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
               <UserPlus size={64} className="text-slate-100 mx-auto mb-6" />
               <p className="text-slate-300 font-black text-2xl uppercase tracking-widest italic">لا يوجد معلمون مسجلون حالياً</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-center md:text-right relative z-10">
              <h3 className="text-3xl font-black mb-2">نظام الدعوات</h3>
              <p className="text-slate-400 font-bold text-lg">قم بتوليد أكواد فريدة للسماح للمعلمين بالانضمام لمنصتك.</p>
            </div>
            <button onClick={handleGenerateCode} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-5 rounded-[2.5rem] font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-indigo-100 relative z-10 text-lg group">
              <Plus size={24} className="group-hover:rotate-90 transition-transform" /> توليد كود دعوة
            </button>
          </div>
          <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  <tr>
                    <th className="p-10">الكود السري</th>
                    <th className="p-10">الحالة التشغيلية</th>
                    <th className="p-10">اسم المستخدم</th>
                    <th className="p-10 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activationCodes.map(code => (
                    <tr key={code.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="p-10 font-black text-2xl tracking-[0.3em] text-slate-900 group-hover:text-indigo-600 transition-colors">{code.code}</td>
                      <td className="p-10">
                        <span className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest ${code.is_used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                          {code.is_used ? 'تم استخدامه' : 'جاهز للتفعيل'}
                        </span>
                      </td>
                      <td className="p-10 font-black text-slate-600 text-sm">{code.used_profile?.full_name || '—'}</td>
                      <td className="p-10 text-center">
                        <button onClick={() => copyToClipboard(code.code)} className={`p-5 rounded-[1.5rem] transition-all shadow-xl ${copiedCode === code.code ? 'bg-emerald-600 text-white' : 'bg-white text-indigo-600 border border-slate-100 hover:scale-110'}`}>
                          {copiedCode === code.code ? <Check size={24}/> : <Copy size={24}/>}
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-right">
          <form onSubmit={handleUpdateTeacher} className="bg-white w-full max-w-lg p-12 lg:p-16 rounded-[4.5rem] shadow-2xl relative animate-in zoom-in duration-300 border border-white/50">
             <button type="button" onClick={() => setIsEditModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all hover:rotate-90"><X size={36}/></button>
             <h2 className="text-3xl font-black mb-12 text-slate-900">تعديل حساب المعلم</h2>
             <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الثلاثي</label>
                  <input required className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-black focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">رقم الهاتف</label>
                  <input required className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-black focus:bg-white focus:border-indigo-500 outline-none transition-all text-left text-sm tracking-widest" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-4 text-lg mt-6">
                  <Save size={24}/> حفظ التغييرات
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Teachers;