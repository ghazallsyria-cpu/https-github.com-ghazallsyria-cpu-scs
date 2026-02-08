
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, RefreshCw, CheckCircle, XCircle, 
  Trash2, Users, UserRound, BookOpen, 
  Phone, GraduationCap, ChevronDown, ChevronUp, Link2, X, AlertTriangle, ShieldAlert, Eye
} from 'lucide-react';
// Fix: Bypassing TypeScript "no exported member" error for useNavigate by using a dynamic import cast.
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM as any;

const Teachers = ({ onMonitor, currentMonitoredId }: { onMonitor: (t: any) => void, currentMonitoredId?: string }) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents'>('teachers');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [relations, setRelations] = useState<any>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleMonitor = (teacher: any) => {
    onMonitor(teacher);
    navigate('/'); // العودة للرئيسية لعرض بيانات المعلم
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      if (activeTab === 'teachers') {
         const { data: stds } = await supabase.from('students').select('id').eq('teacher_id', confirmDeleteId);
         const sIds = stds?.map(s => s.id) || [];
         if (sIds.length > 0) {
            await supabase.from('lessons').delete().in('student_id', sIds);
            await supabase.from('payments').delete().in('student_id', sIds);
            await supabase.from('schedules').delete().in('student_id', sIds);
            await supabase.from('students').delete().eq('teacher_id', confirmDeleteId);
         }
      }

      const { error } = await supabase.from('profiles').delete().eq('id', confirmDeleteId);
      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError("فشل الحذف المطلق: " + (err.message || "خطأ غير معروف"));
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchRelations = async (id: string, value: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    try {
      if (activeTab === 'teachers') {
        const { data } = await supabase.rpc('get_teacher_parents', { teacher_uuid: id });
        setRelations({ ...relations, [id]: data || [] });
      } else {
        const { data } = await supabase.rpc('get_parent_teachers', { parent_phone_val: value });
        setRelations({ ...relations, [id]: data || [] });
      }
      setExpandedId(id);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
               {activeTab === 'teachers' ? <Users size={32} /> : <UserRound size={32} />}
            </div>
            <div>
               <h1 className="text-3xl font-black">إدارة <span className="text-indigo-600">{activeTab === 'teachers' ? 'المعلمين' : 'أولياء الأمور'}</span></h1>
               <p className="text-slate-400 font-bold">بصفتك مديراً، تملك السلطة المطلقة للرقابة والتحكم.</p>
            </div>
         </div>
         <div className="bg-slate-100 p-2 rounded-[2rem] flex items-center gap-2">
            <button onClick={() => { setActiveTab('teachers'); setExpandedId(null); }} className={`px-10 py-4 rounded-[1.5rem] font-black transition-all ${activeTab === 'teachers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>المعلمون</button>
            <button onClick={() => { setActiveTab('parents'); setExpandedId(null); }} className={`px-10 py-4 rounded-[1.5rem] font-black transition-all ${activeTab === 'parents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>أولياء الأمور</button>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {!loading ? users.map(u => (
           <div key={u.id} className={`bg-white rounded-[3rem] border transition-all hover:shadow-md overflow-hidden ${currentMonitoredId === u.id ? 'ring-2 ring-amber-400 shadow-lg' : 'shadow-sm'}`}>
              <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner">{u.full_name[0]}</div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          {u.full_name}
                          {currentMonitoredId === u.id && <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-full animate-pulse border border-amber-100">قيد المراقبة الآن</span>}
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
                          <Eye size={18} /> {currentMonitoredId === u.id ? 'تراقب حالياً' : 'مراقبة الحساب'}
                       </button>
                    )}

                    <button onClick={() => fetchRelations(u.id, u.phone)} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600">
                       <Link2 size={16} /> {activeTab === 'teachers' ? 'الأهالي' : 'المعلمون'}
                    </button>

                    <button onClick={() => toggleApproval(u.id, u.is_approved)} className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${u.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                       {u.is_approved ? <CheckCircle size={18} /> : <XCircle size={18} />} {u.is_approved ? 'مفعل' : 'تفعيل'}
                    </button>
                    
                    <button onClick={() => { setConfirmDeleteId(u.id); setDeleteError(null); }} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                 </div>
              </div>
           </div>
         )) : (
           <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
              <RefreshCw size={48} className="mx-auto text-indigo-100 mb-6 animate-spin" />
              <p className="text-slate-400 font-black text-xl">جاري تحميل البيانات الإدارية...</p>
           </div>
         )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={40} /></div>
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-slate-900">حذف نهائي وشامل؟</h3>
                 <p className="text-slate-500 font-bold text-sm">سيتم مسح الحساب وكافة البيانات المرتبطة به فوراً من السيرفر.</p>
                 {deleteError && <div className="mt-4 p-4 bg-rose-50 text- rose-600 text-[10px] font-black rounded-xl border border-rose-100">{deleteError}</div>}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">تراجع</button>
                 <button onClick={handleDeleteUser} disabled={isDeleting} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">
                    {isDeleting ? 'جاري المسح...' : 'تأكيد الحذف'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
