
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, CheckCircle, AlertCircle, Users, 
  Phone, Search, RefreshCw, ChevronLeft, Save, 
  Settings, UserCheck, Link as LinkIcon, Briefcase, X, Award, ShieldCheck
} from 'lucide-react';

const Students = ({ isAdmin, role, uid, year, semester }: { isAdmin: boolean, role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' as any }] });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (role !== 'admin') query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;

      if (role === 'admin') {
        const consolidatedMap = new Map();
        data?.forEach(s => {
          const key = s.primary_phone || s.id;
          if (consolidatedMap.has(key)) {
            const existing = consolidatedMap.get(key);
            existing.total_paid += (s.total_paid || 0);
            existing.total_lessons += (s.total_lessons || 0);
            const currentBalance = s.is_hourly ? ((s.total_hours || 0) * (s.price_per_hour || 0)) - (s.total_paid || 0) : (s.agreed_amount || 0) - (s.total_paid || 0);
            existing.remaining_balance += currentBalance;
          } else {
            consolidatedMap.set(key, { ...s });
          }
        });
        setStudents(Array.from(consolidatedMap.values()));
      } else {
        setStudents(data || []);
      }
    } catch (e: any) { showFeedback(`خطأ: ${e.message}`, "error"); } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const filteredStudents = useMemo(() => students.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())), [students, searchTerm]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-right font-['Cairo'] pb-32">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black bg-indigo-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-6 md:gap-10 z-10">
           <div className="bg-indigo-600 p-6 md:p-8 rounded-[2rem] md:rounded-[2.8rem] text-white shadow-2xl rotate-6 shrink-0 transition-transform hover:rotate-0 duration-500">
             <Users size={40}/>
           </div>
           <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">سجل الطلاب</h1>
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">إدارة {students.length} طالب مسجل بالمنصة</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-10">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input placeholder="ابحث بالاسم..." className="w-full pr-14 pl-6 py-4 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
            <Plus size={20} /> إضافة طالب
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-6"><RefreshCw className="animate-spin text-indigo-600" size={60} /></div>
        ) : filteredStudents.map(s => {
          const isSettled = s.remaining_balance <= 0;
          return (
            <div key={s.id} className={`p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] border transition-all group flex flex-col relative overflow-hidden shadow-sm hover:shadow-2xl ${isSettled ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100'}`}>
              
              {isSettled && (
                <div className="absolute top-0 left-0 bg-emerald-600 text-white px-8 py-2 rounded-br-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <ShieldCheck size={14}/> خالص الذمة
                </div>
              )}

              <div className="flex justify-between items-start mb-8 mt-4 relative z-10">
                 <div className="overflow-hidden">
                   <h3 className={`text-xl md:text-2xl font-black truncate group-hover:text-indigo-600 transition-colors ${isSettled ? 'text-emerald-900' : 'text-slate-900'}`}>{s.name}</h3>
                   <span className={`px-5 py-1.5 rounded-full text-[9px] font-black border mt-3 block w-fit ${isSettled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>الصف {s.grade}</span>
                 </div>
                 <button onClick={() => { setForm({ ...s, agreed_amount: s.agreed_amount?.toString() || '', price_per_hour: s.price_per_hour?.toString() || '' }); setSelectedStudentId(s.id); setIsEditMode(true); setIsModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"><Settings size={20}/></button>
              </div>

              <div className="space-y-3 mb-10 flex-1">
                 {s.phones?.map((p: any, i: number) => (
                   <div key={i} className="flex items-center gap-4 text-[11px] font-black text-slate-500 bg-white/50 p-4 rounded-2xl border border-slate-100/50">
                      <Phone size={14} className={isSettled ? 'text-emerald-500' : 'text-indigo-400'} />
                      <span className="tracking-widest">{p.number}</span>
                   </div>
                 ))}
              </div>

              <div className={`pt-8 border-t flex justify-between items-center ${isSettled ? 'border-emerald-100' : 'border-slate-50'}`}>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">الرصيد المتبقي</p>
                    <p className={`text-2xl md:text-3xl font-black tracking-tighter ${isSettled ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {isSettled ? '0' : `$${(s.remaining_balance || 0).toLocaleString()}`}
                    </p>
                 </div>
                 <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className={`p-5 rounded-[1.8rem] transition-all shadow-xl active:scale-90 ${isSettled ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                   <ChevronLeft size={22} className="rotate-180" />
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[600] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-2xl p-10 md:p-16 rounded-[3rem] md:rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[95vh] overflow-y-auto no-scrollbar border border-white/20 text-right" dir="rtl">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={32}/></button>
            <h2 className="text-3xl font-black mb-12 text-slate-900">بيانات الطالب</h2>
            <div className="space-y-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">الاسم الكامل</label>
                  <input required placeholder="اسم الطالب..." className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-xl outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">رقم الهاتف</label>
                  <input required type="tel" placeholder="0000 0000" className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-xl text-left outline-none" value={form.phones[0].number} onChange={e => {
                      const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                    }} />
               </div>
               <div className="p-10 bg-indigo-50/50 rounded-[3rem] space-y-8 border-2 border-dashed border-indigo-100">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="h" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-6 h-6 accent-indigo-600" />
                    <label htmlFor="h" className="font-black text-slate-700">المحاسبة بنظام الساعة</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة ($)" className="w-full p-8 bg-white rounded-[2rem] font-black text-center text-4xl text-indigo-600 outline-none" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="مبلغ المادة ($)" className="w-full p-8 bg-white rounded-[2rem] font-black text-center text-4xl text-slate-900 outline-none" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
               <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] text-xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">حفظ البيانات</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
