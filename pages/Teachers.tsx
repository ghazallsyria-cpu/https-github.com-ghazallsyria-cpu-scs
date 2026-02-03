
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
// Added Plus to the imports from lucide-react
import { ShieldCheck, Calendar, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, UserPlus, X, Lock, User, KeyRound, Copy, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Teachers = ({ onSupervise }: { onSupervise: (teacher: {id: string, name: string} | null) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', mobile: '', password: '', gender: 'male' });
  const [activeTab, setActiveTab] = useState<'list' | 'codes'>('list');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
    fetchCodes();
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

  async function fetchCodes() {
    const { data } = await supabase.from('activation_codes').select('*, profiles:used_by(full_name)').order('created_at', { ascending: false });
    setActivationCodes(data || []);
  }

  const handleGenerateCode = async () => {
    const newCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('activation_codes').insert([{
      code: newCode,
      created_by: user?.id
    }]);

    if (error) showFeedback("فشل توليد الكود", 'error');
    else {
      showFeedback("تم توليد كود تفعيل جديد بنجاح");
      fetchCodes();
    }
  };

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
    if (!confirm("حذف المعلم سيؤدي لحذف كافة طلابه ودروسه ومدفوعاته. هل أنت متأكد؟")) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم حذف المعلم بنجاح");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("فشل الحذف", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleAddTeacherManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const virtualEmail = `${addForm.mobile.trim()}@system.local`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: addForm.password,
        options: { data: { full_name: addForm.fullName } }
      });

      if (signUpError) throw signUpError;
      if (data.user) {
        await supabase.from('profiles').update({
          full_name: addForm.fullName, phone: addForm.mobile, gender: addForm.gender,
          role: 'teacher', is_approved: true
        }).eq('id', data.user.id);
        showFeedback("تم إضافة المعلم وتفعيل حسابه يدوياً بنجاح");
        setIsAddModalOpen(false);
        setAddForm({ fullName: '', mobile: '', password: '', gender: 'male' });
        fetchTeachers();
      }
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setLoading(false); }
  };

  const handleSupervise = (t: any) => {
    onSupervise({ id: t.id, name: t.full_name });
    navigate('/');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المنظومة</h1>
          <p className="text-slate-500 font-bold mt-1">إدارة حسابات المعلمين وأكواد التفعيل لضمان سير العمل.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <UserPlus size={20} /> إضافة معلم يدوياً
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 w-fit">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <User size={18}/> المعلمون والطلبات {pendingCount > 0 && <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-md text-[10px]">{pendingCount}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('codes')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <KeyRound size={18}/> أكواد التفعيل
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-8 rounded-[2.5rem] border transition-all relative group ${t.is_approved ? 'border-slate-200 shadow-sm' : 'border-amber-200 shadow-xl shadow-amber-50 ring-2 ring-amber-100'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm ${t.gender === 'female' ? 'bg-pink-50 text-pink-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  <UserCircle size={36} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSupervise(t)} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm" title="إشراف"><Eye size={20} /></button>
                  {!t.is_approved ? (
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm" title="موافقة"><CheckCircle size={20} /></button>
                  ) : (
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className="p-3 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl transition-all shadow-sm" title="إلغاء التفعيل"><XCircle size={20} /></button>
                  )}
                  <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all" title="حذف"><Trash2 size={20} /></button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">{t.full_name}</h3>
              <div className="flex items-center gap-4 mb-6">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${t.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.is_approved ? 'حساب نشط' : 'قيد المراجعة'}</span>
                <span className="text-[10px] font-black text-slate-400">{t.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
              </div>
              <div className="space-y-4 pt-6 border-t border-slate-50 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-3"><Phone size={16} className="text-indigo-400" /> {t.phone || 'غير مسجل'}</div>
                <div className="flex items-center gap-3"><Calendar size={16} className="text-indigo-400" /> انضم في: {new Date(t.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600"><KeyRound size={28}/></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">توليد أكواد التفعيل</h3>
                <p className="text-slate-500 font-bold text-sm">يمكنك إعطاء هذه الأكواد للمعلمين لتفعيل حساباتهم فورياً.</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateCode}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-100 active:scale-95"
            >
              <Plus size={20} /> توليد كود جديد
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6">الكود</th>
                  <th className="p-6">الحالة</th>
                  <th className="p-6">المستخدم</th>
                  <th className="p-6">تاريخ الإنشاء</th>
                  <th className="p-6 text-center">نسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activationCodes.map(code => (
                  <tr key={code.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-black text-slate-900 tracking-widest uppercase">{code.code}</td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${code.is_used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 animate-pulse'}`}>
                        {code.is_used ? 'مستخدم' : 'نشط / بانتظار استخدامه'}
                      </span>
                    </td>
                    <td className="p-6 font-bold text-slate-600 text-sm">{code.profiles?.full_name || '-'}</td>
                    <td className="p-6 font-bold text-slate-400 text-xs">{new Date(code.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="p-6 text-center">
                      <button 
                        onClick={() => copyToClipboard(code.code)}
                        className={`p-3 rounded-xl transition-all ${copiedCode === code.code ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}
                      >
                        {copiedCode === code.code ? <Check size={18}/> : <Copy size={18}/>}
                      </button>
                    </td>
                  </tr>
                ))}
                {activationCodes.length === 0 && (
                  <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400 italic">لا توجد أكواد مولدة حالياً.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddTeacherManual} className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><UserPlus size={24}/></div>
              <h2 className="text-2xl font-black text-slate-900">إضافة معلم يدوي</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1"><User size={12}/> الاسم الكامل</label><input required placeholder="الاسم" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={addForm.fullName} onChange={e => setAddForm({...addForm, fullName: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1"><Phone size={12}/> الموبايل</label><input required placeholder="09xxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left" value={addForm.mobile} onChange={e => setAddForm({...addForm, mobile: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1"><Lock size={12}/> السر</label><input required type="password" placeholder="••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">الجنس</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})}><option value="male">ذكر</option><option value="female">أنثى</option></select></div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 mt-4">{loading ? "جاري الإنشاء..." : "إضافة وتفعيل"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Teachers;
