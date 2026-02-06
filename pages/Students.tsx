
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
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
    <div className="space-y-8 animate-in fade-in duration-700 text-right font-['Cairo'] pb-32">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 font-black bg-indigo-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-5 md:gap-8 z-10">
           <div className="bg-indigo-600 p-5 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] text-white shadow-xl shrink-0 rotate-3">
             <Users size={32}/>
           </div>
           <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">سجل الطلاب</h1>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1">إجمالي {students.length} طالب في النظام</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input placeholder="ابحث..." className="w-full pr-12 pl-4 py-3 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 text-sm">
            <Plus size={18} /> إضافة طالب
          </button>
        </div>
      </div>

      {/* STUDENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-4"><RefreshCw className="animate-spin text-indigo-600" size={48} /></div>
        ) : filteredStudents.map(s => {
          // Distinction for students with no balance (Settled)
          const isSettled = s.remaining_balance <= 0;
          return (
            <div key={s.id} className={`p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border-2 transition-all group flex flex-col relative overflow-hidden shadow-sm hover:shadow-2xl ${isSettled ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-slate-100'}`}>
              
              {isSettled && (
                <div className="absolute top-0 left-0 bg-emerald-600 text-white px-8 py-2 rounded-br-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-left-4">
                  <ShieldCheck size={16}/> خالص الذمة مالياً
                </div>
              )}

              <div className="flex justify-between items-start mb-8 mt-6 relative z-10">
                 <div className="overflow-hidden">
                   <h3 className={`text-xl md:text-2xl font-black truncate transition-colors ${isSettled ? 'text-emerald-900' : 'text-slate-900 group-hover:text-indigo-600'}`}>{s.name}</h3>
                   <span className={`px-5 py-1.5 rounded-full text-[9px] font-black border mt-3 inline-block ${isSettled ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>الصف {s.grade}</span>
                 </div>
                 <button onClick={() => { setForm({ ...s, agreed_amount: s.agreed_amount?.toString() || '', price_per_hour: s.price_per_hour?.toString() || '' }); setSelectedStudentId(s.id); setIsEditMode(true); setIsModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"><Settings size={20}/></button>
              </div>

              <div className="space-y-3 mb-10 flex-1">
                 {s.phones?.map((p: any, i: number) => (
                   <div key={i} className="flex items-center gap-4 text-[11px] font-black text-slate-500 bg-white/60 p-4 rounded-2xl border border-slate-100/50 shadow-sm">
                      <Phone size={16} className={isSettled ? 'text-emerald-500' : 'text-indigo-400'} />
                      <span className="tracking-widest">{p.number}</span>
                   </div>
                 ))}
              </div>

              <div className={`pt-8 border-t flex justify-between items-center ${isSettled ? 'border-emerald-100' : 'border-slate-50'}`}>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">الرصيد المتبقي</p>
                    <p className={`text-2xl md:text-3xl font-black tracking-tighter ${isSettled ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {isSettled ? '0 د.ك' : `${(s.remaining_balance || 0).toLocaleString()} د.ك`}
                    </p>
                 </div>
                 <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className={`p-5 rounded-[1.8rem] transition-all shadow-xl active:scale-90 ${isSettled ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                   <ChevronLeft size={24} className="rotate-180" />
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL STUDENT FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-2xl z-[600] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-xl p-8 md:p-12 rounded-[3rem] md:rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/10 text-right" dir="rtl">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={32}/></button>
            <h2 className="text-3xl font-black mb-12 text-slate-900">بيانات الطالب المعتمدة</h2>
            <div className="space-y-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">الاسم الكامل</label>
                  <input required placeholder="اسم الطالب..." className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-6 uppercase tracking-widest">رقم الهاتف الأساسي</label>
                  <input required type="tel" placeholder="رقم الهاتف..." className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-xl text-left outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.phones[0].number} onChange={e => {
                      const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                    }} />
               </div>
               <div className="p-10 bg-indigo-50/50 rounded-[3rem] space-y-8 border-2 border-dashed border-indigo-100">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="h" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-6 h-6 accent-indigo-600 rounded-lg" />
                    <label htmlFor="h" className="font-black text-slate-700">نظام المحاسبة بالساعة</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة..." className="w-full p-8 bg-white rounded-[2rem] font-black text-center text-4xl text-indigo-600 outline-none shadow-sm" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="المبلغ المتفق عليه للمادة..." className="w-full p-8 bg-white rounded-[2rem] font-black text-center text-4xl text-slate-900 outline-none shadow-sm" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] text-xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-4">
                 {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={28}/>}
                 حفظ بيانات الطالب
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
