
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, Plus, Copy, Check, RefreshCw, Edit3, Save, X, UserPlus, Star, Key
} from 'lucide-react';

const Teachers = ({ onSupervise }: { onSupervise: (teacher: {id: string, name: string} | null) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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
      console.error("Error fetching codes:", err);
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
      showFeedback("خطأ في التحديث: " + err.message, 'error');
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
      showFeedback("فشل الحذف: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    const newCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    try {
      const { error } = await supabase.from('activation_codes').insert([{ 
        code: newCode, 
        is_used: false 
      }]);
      if (error) throw error;
      showFeedback("تم توليد كود تفعيل جديد بنجاح: " + newCode);
      fetchCodes();
    } catch (err: any) {
      console.error("Code generation error:", err);
      showFeedback("فشل توليد الكود. يرجى التأكد من تشغيل تحديث SQL الأخير في Supabase.", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: !currentStatus }).eq('id', id);
      if (error) throw error;
      showFeedback(currentStatus ? "تم تعطيل حساب المعلم" : "تم تنشيط حساب المعلم بنجاح");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("فشل تحديث الحالة: " + err.message, 'error');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[150] px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          {feedback.msg}
        </div>
      )}

      <div className="bg-white p-10 lg:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-8">
           <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl shrink-0 rotate-3">
             <ShieldCheck size={40} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 leading-tight">إدارة شؤون المعلمين</h1>
             <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">التحكم المركزي في حسابات وصلاحيات المنصة</p>
           </div>
        </div>
        <button onClick={() => { fetchTeachers(); fetchCodes(); }} className="bg-slate-50 text-slate-400 p-5 rounded-3xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm active:scale-95">
          <RefreshCw size={28} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-4 p-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl w-full md:w-fit mx-auto overflow-hidden">
        <button onClick={() => setActiveTab('list')} className={`flex-1 md:px-14 py-5 rounded-[2.5rem] font-black text-sm transition-all duration-300 ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}>قائمة المعلمين</button>
        <button onClick={() => setActiveTab('codes')} className={`flex-1 md:px-14 py-5 rounded-[2.5rem] font-black text-sm transition-all duration-300 ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}>أكواد التفعيل</button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-10 rounded-[4rem] border-2 transition-all group relative overflow-hidden shadow-sm hover:shadow-2xl ${t.is_approved ? 'border-white hover:border-indigo-500' : 'border-amber-200 bg-amber-50/10'}`}>
              <div className="flex justify-between items-start mb-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner shrink-0 bg-indigo-100 text-indigo-500`}>
                  <UserCircle size={44} />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => onSupervise({ id: t.id, name: t.full_name })} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm"><Eye size={18} /></button>
                    <button onClick={() => handleOpenEdit(t)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit3 size={18} /></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className={`p-3 rounded-xl transition-all shadow-sm ${t.is_approved ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                      {t.is_approved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600">{t.full_name}</h3>
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
          {teachers.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
               <UserCircle size={64} className="mx-auto text-slate-100 mb-4" />
               <p className="text-slate-400 font-bold italic">لا توجد طلبات انضمام أو معلمين حالياً.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-center md:text-right relative z-10">
              <h3 className="text-3xl font-black mb-2 flex items-center gap-3">نظام الدعوات الآمن <Key className="text-indigo-400" /></h3>
              <p className="text-slate-400 font-bold text-lg">قم بتوليد أكواد فريدة للسماح للمعلمين الموثوقين بالانضمام فوراً.</p>
            </div>
            <button disabled={isGenerating} onClick={handleGenerateCode} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-6 rounded-[2.5rem] font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl disabled:opacity-50 text-lg relative z-10 group/btn">
              {isGenerating ? <RefreshCw className="animate-spin" /> : <Plus size={24} className="group-hover/btn:rotate-90 transition-transform"/>} توليد كود دعوة جديد
            </button>
          </div>
          <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  <tr>
                    <th className="p-10">الكود السري</th>
                    <th className="p-10">الحالة التشغيلية</th>
                    <th className="p-10">استخدم بواسطة</th>
                    <th className="p-10 text-center">نسخ الكود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activationCodes.map(code => (
                    <tr key={code.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="p-10 font-black text-2xl tracking-[0.3em] text-slate-900 group-hover:text-indigo-600">{code.code}</td>
                      <td className="p-10">
                        <span className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest ${code.is_used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                          {code.is_used ? 'مستخدَم مسبقاً' : 'جاهز للتفعيل'}
                        </span>
                      </td>
                      <td className="p-10 font-black text-slate-600 text-sm">{code.used_profile?.full_name || '—'}</td>
                      <td className="p-10 text-center">
                        <button onClick={() => copyToClipboard(code.code)} className={`p-5 rounded-[1.5rem] transition-all shadow-xl ${copiedCode === code.code ? 'bg-emerald-600 text-white' : 'bg-white text-indigo-600 border border-slate-100 hover:border-indigo-600'}`}>
                          {copiedCode === code.code ? <Check size={24}/> : <Copy size={24}/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activationCodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic text-lg">لا توجد أكواد تفعيل حالياً. ابدأ بتوليد أول كود.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-right animate-in fade-in duration-300">
          <form onSubmit={handleUpdateTeacher} className="bg-white w-full max-w-lg p-12 rounded-[4.5rem] shadow-2xl relative animate-in zoom-in duration-300">
             <button type="button" onClick={() => setIsEditModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={36}/></button>
             <h2 className="text-3xl font-black mb-12 text-slate-900">تعديل بيانات الحساب</h2>
             <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الثلاثي المعتمد</label>
                  <input required className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg shadow-inner" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">رقم الهاتف</label>
                  <input required className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg shadow-inner text-left tracking-widest" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50">
                  {loading ? <RefreshCw className="animate-spin" /> : <Save size={24}/>}
                  حفظ كافة التغييرات
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Teachers;
