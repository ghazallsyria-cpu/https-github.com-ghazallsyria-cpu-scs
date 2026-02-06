
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, CheckCircle, AlertCircle, Users, 
  Phone, Search, RefreshCw, ChevronLeft, Save, 
  Settings, UserCheck, Link as LinkIcon, Briefcase, X, Award, ShieldCheck,
  User, Filter
} from 'lucide-react';

const Students = ({ isAdmin, role, uid, year, semester }: { isAdmin: boolean, role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherFilter, setTeacherFilter] = useState('الكل');
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: '', address: '', school_name: '', grade: '12', 
    agreed_amount: '', is_hourly: false, price_per_hour: '', 
    phones: [{ number: '', label: 'الطالب' as any }] 
  });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Students with Teacher Info via join if needed or simple view
      let query = supabase.from('student_summary_view').select('*, profiles:teacher_id(full_name)').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);

      if (isAdmin) {
        const { data: tData } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        setTeachers(tData || []);
      }
    } catch (e: any) { showFeedback(`خطأ: ${e.message}`, "error"); } finally { setLoading(false); }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) return; // Admins don't add personal students in this logic
    setIsSubmitting(true);
    try {
      const studentData = { 
        name: form.name.trim(), grade: form.grade, phones: form.phones, 
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0), 
        is_hourly: form.is_hourly, 
        price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0, 
        teacher_id: uid, academic_year: year, semester: semester, 
        address: form.address, school_name: form.school_name 
      };
      if (isEditMode && selectedStudentId) await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      else await supabase.from('students').insert([studentData]);
      setIsModalOpen(false); fetchStudents();
      showFeedback("تم حفظ بيانات الطالب بنجاح");
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setIsSubmitting(false); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeacher = teacherFilter === 'الكل' || s.teacher_id === teacherFilter;
      return matchesSearch && matchesTeacher;
    });
  }, [students, searchTerm, teacherFilter]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-right font-['Cairo'] pb-32">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 font-black bg-indigo-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* HEADER SECTION (COMMANDER DIRECTORY) */}
      <div className={`p-10 md:p-16 rounded-[4rem] md:rounded-[5rem] border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden ${isAdmin ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        {isAdmin && <div className="absolute top-0 right-0 w-3 h-full bg-indigo-600"></div>}
        <div className="flex items-center gap-8 z-10">
           <div className={`${isAdmin ? 'bg-indigo-600' : 'bg-indigo-600'} p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl shrink-0 rotate-3`}>
             <Users size={40}/>
           </div>
           <div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">
                {isAdmin ? 'دليل الطلاب المركزي' : 'سجل طلابي'}
              </h1>
              <p className={`text-[11px] md:text-xs font-black uppercase tracking-[0.3em] mt-2 ${isAdmin ? 'text-indigo-400' : 'text-slate-400'}`}>إجمالي {students.length} طالب مسجل حالياً</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 w-full md:w-auto z-10">
          {isAdmin && (
            <div className="relative">
               <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
               <select className="w-full md:w-60 pr-14 pl-6 py-4 bg-white/5 border border-white/10 rounded-3xl font-black text-sm outline-none focus:bg-white/10 transition-all text-indigo-200 appearance-none" value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}>
                  <option value="الكل">كل المعلمين</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
               </select>
            </div>
          )}
          <div className="relative flex-1 md:w-80">
            <Search className={`absolute right-6 top-1/2 -translate-y-1/2 ${isAdmin ? 'text-white/20' : 'text-slate-300'}`} size={22} />
            <input placeholder="البحث في الدليل..." className={`w-full pr-16 pl-6 py-5 rounded-[2rem] font-black border-2 border-transparent outline-none transition-all text-lg shadow-inner ${isAdmin ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-slate-50 focus:bg-white focus:border-indigo-100'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {!isAdmin && (
            <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
              <Plus size={24} /> تسجيل طالب جديد
            </button>
          )}
        </div>
      </div>

      {/* GLOBAL DIRECTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-6"><RefreshCw className="animate-spin text-indigo-600" size={64} /></div>
        ) : filteredStudents.map(s => {
          const isSettled = s.remaining_balance <= 0;
          return (
            <div key={s.id} className={`p-8 md:p-12 rounded-[3.5rem] md:rounded-[4.5rem] border-2 transition-all group flex flex-col relative overflow-hidden shadow-sm hover:shadow-2xl ${isAdmin ? 'bg-white border-slate-50' : (isSettled ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-slate-50')}`}>
              
              {isSettled && (
                <div className="absolute top-0 left-0 bg-emerald-600 text-white px-10 py-3 rounded-br-[2.5rem] font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-2xl z-20">
                  <ShieldCheck size={18}/> {isAdmin ? 'خالص' : 'خالص مالياً'}
                </div>
              )}

              <div className="flex justify-between items-start mb-10 mt-6 relative z-10">
                 <div className="overflow-hidden">
                   <h3 className={`text-2xl md:text-3xl font-black truncate transition-colors ${isAdmin ? 'text-slate-900' : (isSettled ? 'text-emerald-900' : 'text-slate-900 group-hover:text-indigo-600')}`}>{s.name}</h3>
                   <div className="flex flex-wrap gap-2 mt-4">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black border tracking-widest ${isAdmin ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : (isSettled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100')}`}>الصف {s.grade}</span>
                      {isAdmin && (
                        <span className="px-5 py-2 rounded-full text-[10px] font-black border bg-slate-900 text-white border-slate-900 flex items-center gap-2">
                           <Briefcase size={12}/> {s.profiles?.full_name || 'غير معروف'}
                        </span>
                      )}
                   </div>
                 </div>
                 {!isAdmin && (
                   <button onClick={() => { setForm({ ...s, agreed_amount: s.agreed_amount?.toString() || '', price_per_hour: s.price_per_hour?.toString() || '' }); setSelectedStudentId(s.id); setIsEditMode(true); setIsModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 rounded-3xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"><Settings size={24}/></button>
                 )}
              </div>

              <div className="space-y-4 mb-12 flex-1">
                 {s.phones?.map((p: any, i: number) => (
                   <div key={i} className={`flex items-center gap-5 text-sm font-black p-5 rounded-3xl border shadow-inner ${isAdmin ? 'bg-slate-50 border-slate-100 text-slate-600' : (isSettled ? 'bg-white text-emerald-600 border-emerald-50' : 'bg-slate-50 border-slate-100 text-slate-500')}`}>
                      <Phone size={20} className={isSettled ? 'text-emerald-500' : 'text-indigo-400'} />
                      <span className="tracking-[0.2em]">{p.number}</span>
                   </div>
                 ))}
              </div>

              <div className={`pt-10 border-t flex justify-between items-center ${isSettled ? 'border-emerald-100' : 'border-slate-50'}`}>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">المبلغ المتبقي</p>
                    <p className={`text-3xl md:text-4xl font-black tracking-tighter ${isSettled ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {isSettled ? '0 د.ك' : `${(s.remaining_balance || 0).toLocaleString()} د.ك`}
                    </p>
                 </div>
                 <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className={`p-6 rounded-[2.2rem] transition-all shadow-2xl active:scale-90 ${isSettled ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'}`}>
                   <ChevronLeft size={28} className="rotate-180" />
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TEACHER-ONLY MODAL */}
      {!isAdmin && isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[600] flex items-center justify-center p-6 text-right">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-2xl p-14 lg:p-20 rounded-[4rem] lg:rounded-[6rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-12 left-12 text-slate-300 hover:text-rose-500 transition-all"><X size={44}/></button>
            <h2 className="text-4xl font-black mb-16 text-slate-900">بيانات الطالب المعتمدة</h2>
            <div className="space-y-10">
               <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">الاسم الثلاثي للطالب</label>
                  <input required placeholder="الاسم الكامل..." className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               </div>
               <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">رقم الهاتف للتواصل</label>
                  <input required type="tel" placeholder="0000 0000" className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-2xl text-left outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.phones[0].number} onChange={e => {
                      const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                    }} />
               </div>
               <div className="p-12 bg-indigo-50/50 rounded-[3.5rem] space-y-10 border-4 border-dashed border-indigo-100">
                  <div className="flex items-center gap-6">
                    <input type="checkbox" id="h" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-8 h-8 accent-indigo-600 rounded-xl" />
                    <label htmlFor="h" className="font-black text-slate-700 text-xl">نظام المحاسبة بالساعة (تدريس خاص)</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة (د.ك)" className="w-full p-10 bg-white rounded-[3rem] font-black text-center text-6xl text-indigo-600 outline-none shadow-xl" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="المبلغ الفصلي المتفق عليه (د.ك)" className="w-full p-10 bg-white rounded-[3rem] font-black text-center text-6xl text-slate-900 outline-none shadow-xl" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[3rem] text-2xl shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-5">
                 {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={36}/>}
                 حفظ بيانات الطالب بمركز القيادة
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
