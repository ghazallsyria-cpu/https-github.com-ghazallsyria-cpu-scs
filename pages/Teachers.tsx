
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, RefreshCw, CheckCircle, XCircle, 
  Trash2, Users, UserRound, Phone, AlertTriangle, Eye, Search, Star
} from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM as any;

const Teachers = ({ onMonitor, currentMonitoredId }: { onMonitor: (t: any) => void, currentMonitoredId?: string }) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents'>('teachers');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const roleToFetch = activeTab === 'teachers' ? 'teacher' : 'parent';
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', roleToFetch)
        .order('is_approved', { ascending: true }) // غير المعتمدين أولاً
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleApproval = async (user: any) => {
    const { error } = await supabase.from('profiles').update({ is_approved: !user.is_approved }).eq('id', user.id);
    if (!error) fetchUsers();
    else alert("فشل تحديث الحالة");
  };

  const handleMonitor = (teacher: any) => {
    onMonitor(teacher);
    navigate('/');
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await supabase.from('students').delete().eq('teacher_id', confirmDeleteId);
      const { error } = await supabase.from('profiles').delete().eq('id', confirmDeleteId);
      
      if (error) throw error;
      setUsers(users.filter(u => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert("تم حذف الملف الشخصي بنجاح.");
      setConfirmDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.includes(searchTerm) || u.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="bg-white p-10 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
               {activeTab === 'teachers' ? <Users size={32} /> : <UserRound size={32} />}
            </div>
            <div>
               <h1 className="text-3xl font-black">إدارة <span className="text-indigo-600">{activeTab === 'teachers' ? 'المعلمون' : 'أولياء الأمور'}</span></h1>
               <p className="text-slate-400 font-bold">بانتظار الإجراء: {users.filter(u => !u.is_approved).length} مستخدمين</p>
            </div>
         </div>
         <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="bg-slate-100 p-2 rounded-[2rem] flex items-center gap-2">
               <button onClick={() => setActiveTab('teachers')} className={`px-8 py-3 rounded-[1.5rem] font-black transition-all ${activeTab === 'teachers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>المعلمين</button>
               <button onClick={() => setActiveTab('parents')} className={`px-8 py-3 rounded-[1.5rem] font-black transition-all ${activeTab === 'parents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>الأهالي</button>
            </div>
            <button onClick={fetchUsers} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {!loading ? (
           filteredUsers.length > 0 ? filteredUsers.map(u => (
             <div key={u.id} className={`bg-white rounded-[3.5rem] border transition-all overflow-hidden relative ${!u.is_approved ? 'border-amber-200 bg-amber-50/20' : 'border-slate-50'}`}>
                {/* عائم للإخطار */}
                {!u.is_approved && (
                   <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400 animate-pulse"></div>
                )}
                
                <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="flex items-center gap-8">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-inner relative transition-all duration-700 ${u.is_approved ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-amber-500 ring-4 ring-amber-100'}`}>
                        {u.full_name[0]}
                        {!u.is_approved && <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-4 border-white"></div>}
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-2xl font-black text-slate-900 leading-none">{u.full_name}</h3>
                            {!u.is_approved && (
                               <span className="text-[10px] font-black bg-amber-500 text-white px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-200">بانتظار التفعيل</span>
                            )}
                         </div>
                         <p className="text-slate-400 font-bold flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-indigo-400" /> {u.phone}
                            {activeTab === 'teachers' && <span className="bg-white border border-slate-100 text-indigo-600 px-4 py-1 rounded-full text-[11px] font-black shadow-sm mr-2">مادة: {u.subjects}</span>}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 flex-wrap justify-center">
                      {activeTab === 'teachers' && u.is_approved && (
                         <button 
                          onClick={() => handleMonitor(u)}
                          className={`px-8 py-4 rounded-[1.8rem] font-black text-sm flex items-center gap-3 transition-all ${currentMonitoredId === u.id ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                         >
                            <Eye size={20} /> {currentMonitoredId === u.id ? 'تراقب حالياً' : 'دخول المراقبة'}
                         </button>
                      )}

                      <button onClick={() => toggleApproval(u)} className={`px-10 py-4 rounded-[1.8rem] font-black text-sm flex items-center gap-3 transition-all shadow-xl active:scale-95 ${u.is_approved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-500 text-white shadow-amber-200'}`}>
                         {u.is_approved ? <CheckCircle size={20} /> : <Star size={20} fill="currentColor" />} {u.is_approved ? 'حساب نشط' : 'تفعيل الحساب الآن'}
                      </button>
                      
                      <button onClick={() => setConfirmDeleteId(u.id)} className="p-5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"><Trash2 size={24} /></button>
                   </div>
                </div>
             </div>
           )) : (
             <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
                <Users size={48} className="mx-auto text-slate-200 mb-6" />
                <p className="text-slate-400 font-black text-xl">لا يوجد مستخدمين قيد المراجعة حالياً</p>
             </div>
           )
         ) : (
           <div className="bg-white p-24 rounded-[4rem] text-center">
              <RefreshCw size={48} className="mx-auto text-indigo-100 mb-6 animate-spin" />
              <p className="text-slate-400 font-black text-xl tracking-tighter">جاري فحص سجلات الوصول الماسية...</p>
           </div>
         )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl">
           <div className="bg-white w-full max-w-md p-14 rounded-[4rem] shadow-2xl space-y-10 animate-in zoom-in duration-300 text-center">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={48} /></div>
              <div className="space-y-3">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter">إلغاء الطلب؟</h3>
                 <p className="text-slate-400 font-bold text-sm leading-relaxed">سيتم حذف هذا المستخدم تماماً من سجلات القمة. لا يمكن التراجع عن هذا الإجراء الماسي.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black">تراجع</button>
                 <button onClick={handleDeleteUser} disabled={isDeleting} className="flex-1 py-6 bg-rose-600 text-white rounded-3xl font-black shadow-xl shadow-rose-100 disabled:opacity-50 active:scale-95">
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
