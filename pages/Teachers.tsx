
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { 
  ShieldCheck, Calendar, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, UserPlus, X, Lock, User, KeyRound, Copy, Check, Plus, Hash, Send, RefreshCw 
} from 'lucide-react';
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
      // جلب كافة البروفايلات التي ليست بمدير
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') 
        .order('is_approved', { ascending: true }) // المعلقين أولاً
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      showFeedback("فشل جلب قائمة المعلمين", 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCodes() {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*, profiles:used_by(full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setActivationCodes(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const handleGenerateCode = async () => {
    const newCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('activation_codes').insert([{
        code: newCode,
        created_by: user?.id
      }]);

      if (error) throw error;
      showFeedback("تم توليد كود تفعيل جديد بنجاح");
      fetchCodes();
    } catch (err: any) {
      showFeedback("فشل توليد الكود: " + err.message, 'error');
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      showFeedback(currentStatus ? "تم تعليق حساب المعلم" : "تم تفعيل حساب المعلم بنجاح");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("حدث خطأ أثناء التحديث", 'error');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("حذف المعلم سيؤدي لحذف كافة طلابه وبياناته. هل أنت متأكد؟")) return;
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
  };

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
        // تحديث البروفايل الذي يتم إنشاؤه تلقائياً بواسطة trigger أو يدوياً
        const { error: profErr } = await supabase.from('profiles').update({
          full_name: addForm.fullName, 
          phone: addForm.mobile.trim(), 
          gender: addForm.gender,
          role: 'teacher', 
          is_approved: true 
        }).eq('id', data.user.id);
        
        if (profErr) throw profErr;

        showFeedback("تم إضافة المعلم وتفعيل حسابه يدوياً");
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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pendingCount = teachers.filter(t => !t.is_approved).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-10">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all animate-in slide-in-from-top-full ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
             <ShieldCheck size={32} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الصلاحيات</h1>
             <p className="text-slate-500 font-bold mt-1">الموافقة على المعلمين الجدد وتوليد أكواد التفعيل الفوري.</p>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchTeachers}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
            title="تحديث البيانات"
          >
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 transition-all active:scale-95"
          >
            <UserPlus size={20} /> إضافة معلم وتفعيل يدوي
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-white rounded-[2rem] border border-slate-200 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-10 py-4 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-3 ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <User size={18}/> قائمة المعلمين {pendingCount > 0 && <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black animate-pulse">{pendingCount} طلب معلق</span>}
        </button>
        <button 
          onClick={() => setActiveTab('codes')}
          className={`px-10 py-4 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-3 ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <KeyRound size={18}/> أكواد التفعيل <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black">{activationCodes.filter(c => !c.is_used).length} متوفر</span>
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-10 rounded-[3.5rem] border transition-all relative group overflow-hidden ${t.is_approved ? 'border-slate-200' : 'border-amber-300 ring-2 ring-amber-100 shadow-xl shadow-amber-50'}`}>
              <div className="flex justify-between items-start mb-8">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner ${t.gender === 'female' ? 'bg-pink-50 text-pink-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  <UserCircle size={48} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onSupervise({ id: t.id, name: t.full_name })} className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm" title="دخول بصفة المعلم"><Eye size={22} /></button>
                  {!t.is_approved ? (
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm" title="تفعيل الآن"><CheckCircle size={22} /></button>
                  ) : (
                    <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className="p-3 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl transition-all shadow-sm" title="تعليق الحساب"><XCircle size={22} /></button>
                  )}
                  <button onClick={() => handleDeleteTeacher(t.id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all" title="حذف نهائي"><Trash2 size={22} /></button>
                </div>
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-2">{t.full_name}</h3>
              <div className="flex items-center gap-4 mb-8">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${t.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>{t.is_approved ? 'حساب نشط' : 'بانتظار الموافقة'}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.gender === 'female' ? 'معلمة' : 'معلم'}</span>
              </div>
              
              <div className="space-y-4 pt-8 border-t border-slate-50 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-4"><Phone size={18} className="text-indigo-400" /> {t.phone || 'غير مسجل'}</div>
                <div className="flex items-center gap-4"><Calendar size={18} className="text-indigo-400" /> انضم: {new Date(t.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          ))}
          {teachers.length === 0 && !loading && (
             <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                <UserCircle size={80} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black text-xl">لا يوجد معلمون مسجلون حالياً.</p>
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="bg-amber-100 p-6 rounded-[2.5rem] text-amber-600 shadow-inner"><KeyRound size={40}/></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">توليد أكواد التنشيط</h3>
                <p className="text-slate-500 font-bold max-w-md">قم بتوليد كود وإرساله يدوياً للمعلم ليقوم بتفعيل حسابه فوراً دون الحاجة لموافقة يدوية منك.</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateCode}
              className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
            >
              <Plus size={24} /> توليد كود جديد
            </button>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
                    <th className="p-8">الكود الرقمي</th>
                    <th className="p-8">الحالة</th>
                    <th className="p-8">المستخدم النهائي</th>
                    <th className="p-8">تاريخ الصدور</th>
                    <th className="p-8 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activationCodes.map(code => (
                    <tr key={code.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="p-8 font-black text-2xl text-slate-900 tracking-[0.2em] uppercase">{code.code}</td>
                      <td className="p-8">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${code.is_used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 animate-pulse'}`}>
                          {code.is_used ? 'مستخدم مسبقاً' : 'نشط / بانتظار الاستخدام'}
                        </span>
                      </td>
                      <td className="p-8 font-black text-slate-600">{code.profiles?.full_name || <span className="text-slate-300 font-normal italic">غير محدد</span>}</td>
                      <td className="p-8 font-bold text-slate-400 text-xs">{new Date(code.created_at).toLocaleDateString('ar-EG', { dateStyle: 'full' })}</td>
                      <td className="p-8">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => copyToClipboard(code.code)}
                            className={`p-4 rounded-2xl transition-all flex items-center gap-2 font-black text-sm ${copiedCode === code.code ? 'bg-emerald-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                            title="نسخ الكود لإرساله"
                          >
                            {copiedCode === code.code ? <><Check size={18}/> تم النسخ</> : <><Copy size={18}/> نسخ</>}
                          </button>
                          <a 
                            href={`https://wa.me/?text=مرحباً، كود تفعيل حسابك هو: ${code.code}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"
                            title="إرسال عبر واتساب"
                          >
                            <Send size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activationCodes.length === 0 && (
                    <tr><td colSpan={5} className="p-20 text-center font-bold text-slate-400 bg-slate-50/10 italic">لا توجد أكواد تفعيل مولدة بعد.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manual Add */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-colors"><X size={28} /></button>
            
            <div className="flex items-center gap-5 mb-10 text-indigo-600">
              <UserPlus size={40} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">إضافة معلم مفعل</h2>
            </div>
            
            <form onSubmit={handleAddTeacherManual} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">الاسم الكامل للمعلم</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input required placeholder="الاسم" className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={addForm.fullName} onChange={e => setAddForm({...addForm, fullName: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">رقم الموبايل (المعرف)</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input required placeholder="09xxxxxxxx" className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all text-left" value={addForm.mobile} onChange={e => setAddForm({...addForm, mobile: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">كلمة السر المؤقتة</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input required type="password" placeholder="••••••••" className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all text-left" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">الجنس</label>
                <select className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})}>
                  <option value="male">ذكر (معلم)</option>
                  <option value="female">أنثى (معلمة)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><ShieldCheck size={24} /> إنشاء الحساب وتفعيله</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
