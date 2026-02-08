
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, RefreshCw, CheckCircle, XCircle, 
  Trash2, Users, UserRound, Phone, Link2, AlertTriangle, Eye, Search
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
      // حذف التبعيات أولاً
      await supabase.from('students').delete().eq('teacher_id', confirmDeleteId);
      const { error } = await supabase.from('profiles').delete().eq('id', confirmDeleteId);
      
      if (error) throw error;
      setUsers(users.filter(u => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert("ملاحظة: تم حذف الملف الشخصي، ولكن السجل الأمني (Authentication) يجب حذفه يدوياً من لوحة تحكم Supabase للسماح بإعادة التسجيل بنفس الرقم.");
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
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
               {activeTab === 'teachers' ? <Users size={32} /> : <UserRound size={32} />}
            </div>
            <div>
               <h1 className="text-3xl font-black">إدارة <span className="text-indigo-600">{activeTab === 'teachers' ? 'المعلمين' : 'أولياء الأمور'}</span></h1>
               <p className="text-slate-400 font-bold">إجمالي المستخدمين المسجلين: {users.length}</p>
            </div>
         </div>
         <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
               <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input 
                placeholder="بحث..." 
                className="w-full pr-12 pl-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
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
             <div key={u.id} className={`bg-white rounded-[3rem] border transition-all hover:shadow-md overflow-hidden ${currentMonitoredId === u.id ? 'ring-2 ring-amber-400 shadow-lg' : 'shadow-sm'}`}>
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${u.is_approved ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                        {u.full_name[0]}
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            {u.full_name}
                            {!u.is_approved && <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100 uppercase">بانتظار التفعيل</span>}
                         </h3>
                         <p className="text-slate-400 font-bold flex items-center gap-2 text-sm">
                            <Phone size={14} /> {u.phone}
                            {activeTab === 'teachers' && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black mr-2">مادة: {u.subjects}</span>}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-3 flex-wrap justify-center">
                      {activeTab === 'teachers' && (
                         <button 
                          onClick={() => handleMonitor(u)}
                          className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${currentMonitoredId === u.id ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                         >
                            <Eye size={18} /> {currentMonitoredId === u.id ? 'تراقب حالياً' : 'مراقبة البيانات'}
                         </button>
                      )}

                      <button onClick={() => toggleApproval(u)} className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${u.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 shadow-lg'}`}>
                         {u.is_approved ? <CheckCircle size={18} /> : <XCircle size={18} />} {u.is_approved ? 'مفعل' : 'تفعيل الحساب'}
                      </button>
                      
                      <button onClick={() => setConfirmDeleteId(u.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                   </div>
                </div>
             </div>
           )) : (
             <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
                <Users size={48} className="mx-auto text-slate-200 mb-6" />
                <p className="text-slate-400 font-black text-xl">لا يوجد مستخدمين يطابقون بحثك</p>
             </div>
           )
         ) : (
           <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
              <RefreshCw size={48} className="mx-auto text-indigo-100 mb-6 animate-spin" />
              <p className="text-slate-400 font-black text-xl">جاري فحص قاعدة البيانات...</p>
           </div>
         )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={40} /></div>
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-slate-900">حذف المستخدم؟</h3>
                 <p className="text-slate-500 font-bold text-sm">سيتم مسح بياناته من الجداول العامة. ملاحظة: يجب مسح حسابه يدوياً من لوحة تحكم Supabase Authentication للسماح له بالتسجيل مجدداً بنفس الرقم.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">إلغاء</button>
                 <button onClick={handleDeleteUser} disabled={isDeleting} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">
                    {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
