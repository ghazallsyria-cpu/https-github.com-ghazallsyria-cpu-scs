
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, RefreshCw, CheckCircle, XCircle, 
  Trash2, Users, UserRound, BookOpen, 
  Phone, GraduationCap, ChevronDown, ChevronUp, Link2, X, AlertTriangle, ShieldAlert
} from 'lucide-react';

const Teachers = () => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents'>('teachers');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [relations, setRelations] = useState<any>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const roleToFetch = activeTab === 'teachers' ? 'teacher' : 'parent';
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', roleToFetch)
      .order('created_at', { ascending: false });
    
    if (error) console.error("Fetch Users Error:", error);
    setUsers(data || []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleApproval = async (id: string, status: boolean) => {
    await supabase.from('profiles').update({ is_approved: !status }).eq('id', id);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // محاولة الحذف
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', confirmDeleteId);

      if (error) {
         // إذا كان الخطأ متعلق بقيود قاعدة البيانات (سجلات مرتبطة)
         if (error.code === '23503') {
            throw new Error("لا يمكن حذف هذا الحساب لوجود بيانات مرتبطة به (طلاب، حصص، أو دفعات). يجب حذف بيانات الطالب أولاً لتتمكن من حذف حساب " + (activeTab === 'teachers' ? 'المعلم' : 'ولي الأمر') + ".");
         }
         throw error;
      }
      
      setUsers(users.filter(u => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err.message || "فشلت عملية الحذف. تأكد من صلاحياتك.");
      console.error("Delete Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchRelations = async (id: string, value: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    try {
      if (activeTab === 'teachers') {
        const { data } = await supabase.rpc('get_teacher_parents', { teacher_uuid: id });
        setRelations({ ...relations, [id]: data || [] });
      } else {
        const { data } = await supabase.rpc('get_parent_teachers', { parent_phone_val: value });
        setRelations({ ...relations, [id]: data || [] });
      }
      setExpandedId(id);
    } catch (e) {
      console.error("Relation Fetch Error:", e);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      {/* Header & Navigation */}
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl">
               {activeTab === 'teachers' ? <Users size={32} /> : <UserRound size={32} />}
            </div>
            <div>
               <h1 className="text-3xl font-black">إدارة <span className="text-indigo-600">{activeTab === 'teachers' ? 'المعلمين' : 'أولياء الأمور'}</span></h1>
               <p className="text-slate-400 font-bold">بصفتك مديراً، تملك السلطة الكاملة للتحكم في الحسابات.</p>
            </div>
         </div>
         
         <div className="bg-slate-100 p-2 rounded-[2rem] flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('teachers'); setExpandedId(null); }}
              className={`px-10 py-4 rounded-[1.5rem] font-black transition-all ${activeTab === 'teachers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >المعلمون</button>
            <button 
              onClick={() => { setActiveTab('parents'); setExpandedId(null); }}
              className={`px-10 py-4 rounded-[1.5rem] font-black transition-all ${activeTab === 'parents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >أولياء الأمور</button>
         </div>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase mb-2">إجمالي {activeTab === 'teachers' ? 'المعلمين' : 'الأهالي'}</p>
            <h4 className="text-3xl font-black text-slate-900">{users.length} مستخدم</h4>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase mb-2">بانتظار الموافقة</p>
            <h4 className="text-3xl font-black text-amber-600">{users.filter(u => !u.is_approved).length} حسابات</h4>
         </div>
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
            <p className="text-xs font-black text-indigo-200 uppercase mb-2">رتبة الحساب</p>
            <h4 className="text-3xl font-black flex items-center gap-2"><ShieldAlert size={24} /> مدير النظام</h4>
         </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-6">
         {!loading ? users.map(u => (
           <div key={u.id} className="bg-white rounded-[3rem] border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner">
                       {u.full_name[0]}
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">{u.full_name}</h3>
                       <p className="text-slate-400 font-bold flex items-center gap-2">
                          <Phone size={14} /> {u.phone}
                          {activeTab === 'teachers' && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black mr-2">مادة: {u.subjects}</span>}
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <button 
                       onClick={() => fetchRelations(u.id, u.phone)}
                       className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                       <Link2 size={16} /> 
                       {activeTab === 'teachers' ? 'أولياء الأمور' : 'المعلمون'}
                       {expandedId === u.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button 
                       onClick={() => toggleApproval(u.id, u.is_approved)}
                       className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${u.is_approved ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                    >
                       {u.is_approved ? <CheckCircle size={18} /> : <XCircle size={18} />}
                       {u.is_approved ? 'مفعل' : 'تفعيل'}
                    </button>
                    
                    <button 
                      onClick={() => { setConfirmDeleteId(u.id); setDeleteError(null); }}
                      className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                       <Trash2 size={20} />
                    </button>
                 </div>
              </div>

              {/* Expansion Panel (Relations) */}
              {expandedId === u.id && (
                <div className="bg-slate-50 p-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                   <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">
                      {activeTab === 'teachers' ? 'أولياء أمور الطلاب المسجلين عند هذا المعلم' : 'المعلمون الذين يدرسون أبناء هذا الحساب'}
                   </h5>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relations[u.id]?.length > 0 ? relations[u.id].map((rel: any, i: number) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                              {activeTab === 'teachers' ? <UserRound size={18} /> : <BookOpen size={18} />}
                           </div>
                           <div>
                              <p className="font-black text-slate-900">{activeTab === 'teachers' ? rel.parent_name : rel.teacher_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                 <GraduationCap size={10} /> طالب: {rel.student_name}
                                 {activeTab === 'parents' && <span className="text-indigo-500 mr-2">({rel.subject})</span>}
                              </p>
                           </div>
                        </div>
                      )) : (
                        <div className="col-span-full py-6 text-center text-slate-400 font-bold italic">لا توجد ارتباطات مسجلة حالياً.</div>
                      )}
                   </div>
                </div>
              )}
           </div>
         )) : (
           <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed">
              <RefreshCw size={48} className="mx-auto text-indigo-100 mb-6 animate-spin" />
              <p className="text-slate-400 font-black text-xl">جاري تحديث السجلات...</p>
           </div>
         )}
         
         {!loading && users.length === 0 && (
            <div className="bg-white p-24 rounded-[4rem] text-center border shadow-sm">
               <Users size={64} className="mx-auto text-slate-100 mb-6" />
               <p className="text-slate-400 font-black text-xl">لا يوجد {activeTab === 'teachers' ? 'معلمون' : 'أولياء أمور'} مسجلون حالياً.</p>
            </div>
         )}
      </div>

      {/* Confirmation Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                 <AlertTriangle size={40} />
              </div>
              
              <div className="text-center">
                 <h3 className="text-2xl font-black mb-2 text-slate-900">حذف نهائي للحساب؟</h3>
                 <p className="text-slate-500 font-bold leading-relaxed">بصفتك مديراً، سيتم حذف {users.find(u => u.id === confirmDeleteId)?.full_name} من النظام تماماً.</p>
                 
                 {deleteError && (
                   <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed">
                      {deleteError}
                   </div>
                 )}
              </div>

              <div className="flex gap-4">
                 <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">تراجع</button>
                 <button 
                  onClick={handleDeleteUser} 
                  disabled={isDeleting}
                  className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-100 disabled:opacity-50 hover:bg-rose-700 transition-all"
                 >
                    {isDeleting ? 'جاري التنفيذ...' : 'تأكيد الحذف'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
