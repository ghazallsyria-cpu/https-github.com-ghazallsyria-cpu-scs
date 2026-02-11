
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  SearchCheck, CheckCircle, XCircle, Clock, 
  RefreshCw, UserPlus, Phone, Briefcase, Star, Trash2, Filter
} from 'lucide-react';

const TutorRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [reqs, techs] = await Promise.all([
      supabase.from('tutor_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'teacher').eq('is_approved', true)
    ]);
    setRequests(reqs.data || []);
    setTeachers(techs.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (requestId: string, teacherId: string) => {
    const { error } = await supabase.from('tutor_requests').update({ status: 'assigned', teacher_id: teacherId }).eq('id', requestId);
    if (!error) fetchData();
    setAssigningId(null);
  };

  return (
    <div className="space-y-10 pb-32">
       <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
             <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><SearchCheck size={32} /></div>
             <div>
                <h1 className="text-3xl font-black">طلبات <span className="text-indigo-600">البحث</span></h1>
                <p className="text-slate-400 font-bold">إدارة طلبات الطلاب ومطابقتها مع المعلمين المتاحين.</p>
             </div>
          </div>
          <button onClick={fetchData} className="p-5 bg-slate-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
       </div>

       <div className="grid grid-cols-1 gap-8">
          {requests.map(req => (
            <div key={req.id} className={`bg-white p-10 rounded-[3.5rem] border-2 transition-all ${req.status === 'pending' ? 'border-amber-200 bg-amber-50/10' : 'border-slate-50'}`}>
               <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                  <div className="flex-1 space-y-6">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-900 shadow-sm">{req.student_name[0]}</div>
                        <div>
                           <h3 className="text-2xl font-black text-slate-900">{req.student_name}</h3>
                           <p className="text-slate-400 font-bold flex items-center gap-2"><Phone size={14} /> {req.student_phone}</p>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        <span className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest">مادة: {req.subject}</span>
                        <span className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black">الصف: {req.grade}</span>
                        <span className="bg-white border border-slate-200 text-slate-500 px-5 py-2 rounded-full text-xs font-black uppercase">{req.modality === 'home' ? '🏠 تعليم منزلي' : '💻 تعليم عن بعد'}</span>
                        <span className="bg-white border border-slate-200 text-slate-500 px-5 py-2 rounded-full text-xs font-black uppercase">{req.type === 'course' ? '📚 كورس كامل' : '🕒 حصص مفردة'}</span>
                     </div>
                     {req.notes && <p className="text-slate-500 font-bold text-sm bg-white/50 p-4 rounded-2xl italic">"{req.notes}"</p>}
                  </div>

                  <div className="w-full lg:w-auto flex flex-col gap-4">
                     {req.status === 'pending' ? (
                       <div className="space-y-4">
                          <button onClick={() => setAssigningId(req.id)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
                             <UserPlus size={20} /> تعيين معلم مطابق
                          </button>
                          <button onClick={async () => { if(confirm("رفض الطلب؟")) { await supabase.from('tutor_requests').update({status: 'rejected'}).eq('id', req.id); fetchData(); }}} className="w-full py-4 text-rose-500 font-black text-xs hover:bg-rose-50 rounded-[1.5rem] transition-all">تجاهل الطلب</button>
                       </div>
                     ) : (
                       <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center gap-4">
                          <CheckCircle size={32} />
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">تم التعيين للمعلم</p>
                             <p className="text-lg font-black">{teachers.find(t => t.id === req.teacher_id)?.full_name}</p>
                          </div>
                       </div>
                     )}
                  </div>
               </div>

               {assigningId === req.id && (
                  <div className="mt-10 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 animate-in slide-in-from-top-4 duration-500">
                     <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3"><Filter size={20} /> المعلمون المتاحون للمطابقة:</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.filter(t => t.is_available).map(tech => (
                          <button key={tech.id} onClick={() => handleAssign(req.id, tech.id)} className="p-6 bg-white rounded-3xl border border-transparent hover:border-indigo-600 transition-all text-right group shadow-sm hover:shadow-xl">
                             <div className="flex items-center gap-4 mb-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">{tech.full_name[0]}</div>
                                <h5 className="font-black text-slate-900">{tech.full_name}</h5>
                             </div>
                             <p className="text-[10px] font-black text-slate-400 mb-1">المادة: {tech.subjects}</p>
                             <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase">
                                <Star size={12} fill="currentColor" /> متاح الآن
                             </div>
                          </button>
                        ))}
                     </div>
                     <button onClick={() => setAssigningId(null)} className="mt-8 text-slate-400 font-black text-xs hover:text-slate-600">إغلاق قائمة الترشيحات</button>
                  </div>
               )}
            </div>
          ))}
       </div>
    </div>
  );
};

export default TutorRequests;
