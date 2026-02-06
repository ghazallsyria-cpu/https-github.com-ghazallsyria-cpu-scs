
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Fix: Use standard v6 hook from react-router-dom
// @ts-ignore: useNavigate might not be seen as exported in this environment
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, CheckCircle, AlertCircle, Users, 
  Phone, Search, RefreshCw, ChevronLeft, Save, 
  Settings, UserCheck, Link as LinkIcon, Briefcase
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
  const [existingStudentFound, setExistingStudentFound] = useState<any>(null);

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
        // ذكاء المدير: تجميع الطلاب حسب رقم الهاتف الموحد (Primary Phone)
        const consolidatedMap = new Map();
        data?.forEach(s => {
          const key = s.primary_phone || s.id;
          if (consolidatedMap.has(key)) {
            const existing = consolidatedMap.get(key);
            existing.is_consolidated = true;
            existing.total_paid += s.total_paid;
            existing.remaining_balance += s.remaining_balance;
            existing.total_lessons += s.total_lessons;
            // دمج المعلمين
            const teacherSet = new Set([...existing.teachers.map((t:any)=>t.id), s.teacher_id]);
            if (teacherSet.size > existing.teachers.length) {
                existing.teachers.push({id: s.teacher_id, name: s.teacher_name});
            }
          } else {
            consolidatedMap.set(key, { ...s, teachers: [{id: s.teacher_id, name: s.teacher_name}], is_consolidated: false });
          }
        });
        setStudents(Array.from(consolidatedMap.values()));
      } else {
        setStudents(data || []);
      }
    } catch (e: any) { showFeedback(`خطأ: ${e.message}`, "error"); } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const checkExistingStudent = async (phone: string) => {
    if (phone.length < 8) return;
    const { data } = await supabase.from('students').select('*, profiles(full_name)').contains('phones', [{ number: phone }]).limit(1);
    if (data && data.length > 0) {
      setExistingStudentFound(data[0]);
      if (!isEditMode) {
        setForm(prev => ({ ...prev, name: data[0].name, address: data[0].address || '', school_name: data[0].school_name || '', grade: data[0].grade }));
      }
    } else { setExistingStudentFound(null); }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const studentData = { name: form.name.trim(), grade: form.grade, phones: form.phones, agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0), is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0, teacher_id: uid, academic_year: year, semester: semester, address: form.address, school_name: form.school_name };
      if (isEditMode && selectedStudentId) await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      else await supabase.from('students').insert([studentData]);
      setIsModalOpen(false); fetchStudents();
      showFeedback("تم الحفظ والربط بنجاح");
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setIsSubmitting(false); }
  };

  const filteredStudents = useMemo(() => students.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && (selectedGrade === 'الكل' || s.grade === selectedGrade)), [students, searchTerm, selectedGrade]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-right font-['Cairo'] pb-32">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black bg-indigo-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-12 lg:p-16 rounded-[5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-10 z-10">
           <div className="bg-indigo-600 p-8 rounded-[2.8rem] text-white shadow-2xl rotate-6 transition-all duration-700"><Users size={44}/></div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">سجل الطلاب {isAdmin ? '(الهوية الرقمية)' : ''}</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">إدارة {students.length} هوية طلابية فريدة</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 w-full md:w-auto z-10">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            <input placeholder="ابحث بالاسم أو الهاتف..." className="w-full pr-16 pl-8 py-5 bg-slate-50 rounded-[2rem] font-black border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setExistingStudentFound(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
            <Plus size={24} /> إضافة طالب
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-6"><RefreshCw className="animate-spin text-indigo-600" size={60} /><p className="font-black text-slate-300 uppercase tracking-widest">مزامنة الهويات الرقمية الموحدة...</p></div>
        ) : filteredStudents.map(s => (
          <div key={s.id} className="bg-white p-10 rounded-[4.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
            {s.is_consolidated && (
               <div className="absolute top-8 left-8 bg-emerald-100 text-emerald-600 p-2 rounded-xl shadow-sm rotate-12" title="هوية موحدة عبر مدرسين متعددين"><LinkIcon size={20}/></div>
            )}
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 truncate max-w-[200px]">{s.name}</h3>
                 <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-indigo-50 text-indigo-600 px-5 py-1.5 rounded-full text-[9px] font-black border border-indigo-100">الصف {s.grade}</span>
                    {isAdmin && s.teachers && (
                       <div className="flex items-center gap-2 bg-slate-50 text-slate-500 px-5 py-1.5 rounded-full text-[9px] font-black border border-slate-100">
                          <Briefcase size={10}/> {s.teachers.length} مدرسين
                       </div>
                    )}
                 </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => { setForm({ ...s, agreed_amount: s.agreed_amount.toString(), price_per_hour: s.price_per_hour.toString() }); setSelectedStudentId(s.id); setIsEditMode(true); setIsModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Settings size={22}/></button>
               </div>
            </div>

            {isAdmin && s.teachers && s.teachers.length > 1 && (
               <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">المدرسون المشتركون:</p>
                  <div className="flex flex-wrap gap-2">
                     {s.teachers.map((t: any, idx: number) => (
                        <span key={idx} className="bg-white px-3 py-1 rounded-lg text-[9px] font-bold text-slate-600 shadow-sm">{t.name}</span>
                     ))}
                  </div>
               </div>
            )}

            <div className="space-y-3 mb-10 flex-1">
               {s.phones?.map((p: any, i: number) => (
                 <div key={i} className="flex items-center gap-4 text-xs font-black text-slate-500 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <Phone size={16} className="text-indigo-400" />
                    <span className="tracking-widest">{p.number} ({p.label})</span>
                 </div>
               ))}
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
               <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">المستحق {isAdmin ? 'الإجمالي' : ''}</p>
                  <p className={`text-3xl font-black tracking-tighter ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ${(s.remaining_balance || 0).toLocaleString()}
                  </p>
               </div>
               <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className="bg-slate-900 text-white p-5 rounded-[1.8rem] hover:bg-indigo-600 transition-all shadow-xl">
                 <ChevronLeft size={24} className="rotate-180" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[600] flex items-center justify-center p-6">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-3xl p-14 lg:p-20 rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[95vh] overflow-y-auto no-scrollbar border border-white/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-14 left-14 text-slate-300 hover:text-rose-500 transition-all"><Settings size={44}/></button>
            <h2 className="text-4xl font-black mb-16 text-slate-900 flex items-center gap-6">
              <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-2xl">{isEditMode ? <Settings size={32}/> : <Plus size={32}/>}</div>
              {isEditMode ? 'تحديث السجل' : 'تسجيل هوية جديدة'}
            </h2>
            
            <div className="space-y-10">
               {existingStudentFound && !isEditMode && (
                  <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 animate-in bounce-in flex items-center gap-6">
                     <div className="bg-white p-4 rounded-2xl text-emerald-600 shadow-sm"><UserCheck size={32}/></div>
                     <div>
                        <p className="font-black text-emerald-900">هذا الطالب مسجل مسبقاً في النظام!</p>
                        <p className="text-xs font-bold text-emerald-700 mt-1">مسجل لدى الأستاذ: {existingStudentFound.profiles?.full_name}. سيتم ربط سجل المادة الجديد بنفس هوية الطالب.</p>
                     </div>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">رقم الهاتف الأساسي</label>
                    <div className="relative">
                       <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                       <input required type="tel" placeholder="رقم الهاتف..." className="w-full pr-16 pl-8 py-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-2xl text-left tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.phones[0].number} onChange={e => {
                           const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                           checkExistingStudent(e.target.value);
                         }} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">الاسم الكامل</label>
                    <input required placeholder="اكتب الاسم هنا..." className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">المرحلة</label>
                    <select className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-lg outline-none cursor-pointer" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       <option value="10">الصف العاشر</option><option value="11">الصف الحادي عشر</option><option value="12">الصف الثاني عشر</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">المدرسة</label>
                    <input placeholder="اسم المدرسة..." className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-lg outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
                  </div>
               </div>

               <div className="p-12 bg-indigo-50/50 rounded-[4rem] space-y-8 border-4 border-dashed border-indigo-100">
                  <div className="flex items-center gap-6">
                    <input type="checkbox" id="h" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-10 h-10 accent-indigo-600 cursor-pointer rounded-xl" />
                    <label htmlFor="h" className="font-black text-slate-700 text-lg cursor-pointer">محاسبة بنظام الساعة</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة ($)" className="w-full p-8 bg-white rounded-[2.5rem] font-black text-center text-5xl text-indigo-600 shadow-2xl outline-none" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="المبلغ المقطوع للمادة ($)" className="w-full p-8 bg-white rounded-[2.5rem] font-black text-center text-5xl text-slate-900 shadow-2xl outline-none" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
            </div>

            <button disabled={isSubmitting} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[3rem] mt-16 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-5 active:scale-95 text-2xl group">
              {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={32} />}
              {existingStudentFound ? 'تأكيد وربط الهوية' : 'تأكيد وحفظ'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
