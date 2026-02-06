
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, RefreshCw, CheckCircle, XCircle, 
  Trash2, Users, UserRound, BookOpen, 
  Phone, GraduationCap, ChevronDown, ChevronUp, Link2
} from 'lucide-react';

const Teachers = () => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents'>('teachers');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [relations, setRelations] = useState<any>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const roleToFetch = activeTab === 'teachers' ? 'teacher' : 'parent';
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', roleToFetch)
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleApproval = async (id: string, status: boolean) => {
    await supabase.from('profiles').update({ is_approved: !status }).eq('id', id);
    fetchUsers();
  };

  const fetchRelations = async (id: string, value: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    if (activeTab === 'teachers') {
      const { data } = await supabase.rpc('get_teacher_parents', { teacher_uuid: id });
      setRelations({ ...relations, [id]: data || [] });
    } else {
      const { data } = await supabase.rpc('get_parent_teachers', { parent_phone_val: value });
      setRelations({ ...relations, [id]: data || [] });
    }
    setExpandedId(id);
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
               <p className="text-slate-400 font-bold">التحكم في الصلاحيات وربط الحسابات ببعضها.</p>
            </div>
         </div>
         
         <div className="bg-slate-100 p-2 rounded-[2rem] flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('teachers')}
              className={`px-10 py-4 rounded-[1.5rem] font-black transition-all ${activeTab === 'teachers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >المعلمون</button>
            <button 
              onClick={() => setActiveTab('parents')}
              className={`px-10 py-4 rounded-[1.5rem] font-black transition-all ${activeTab === 'parents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >أولياء الأمور</button>
         </div>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase mb-2">إجمالي المسجلين</p>
            <h4 className="text-3xl font-black text-slate-900">{users.length} مستخدم</h4>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase mb-2">قيد الانتظار</p>
            <h4 className="text-3xl font-black text-amber-600">{users.filter(u => !u.is_approved).length} حسابات</h4>
         </div>
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
            <p className="text-xs font-black text-indigo-200 uppercase mb-2">حالة النظام</p>
            <h4 className="text-3xl font-black">مستقر ومتصل</h4>
         </div>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-6">
         {users.length > 0 ? users.map(u => (
           <div key={u.id} className="bg-white rounded-[3rem] border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl">
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
                       {activeTab === 'teachers' ? 'أولياء الأمور المرتبطين' : 'المعلمون المرتبطون'}
                       {expandedId === u.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button 
                       onClick={() => toggleApproval(u.id, u.is_approved)}
                       className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${u.is_approved ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                    >
                       {u.is_approved ? <CheckCircle size={18} /> : <XCircle size={18} />}
                       {u.is_approved ? 'مفعل' : 'تفعيل'}
                    </button>
                    
                    <button className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
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
              <RefreshCw size={48} className="mx-auto text-slate-200 mb-6 animate-spin" />
              <p className="text-slate-400 font-black text-xl">جاري استدعاء البيانات...</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default Teachers;
