
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, Trash2, CheckCircle, X, AlertCircle, Users, MessageCircle, 
  Phone, Search, Folder, FolderOpen, RefreshCw, ChevronRight, ChevronLeft, Save, Settings,
  Copy, ArrowRightLeft, Database, HardDriveDownload, History, ShieldCheck, Lock, GraduationCap, FileText,
  DollarSign, Sparkles
} from 'lucide-react';

const Students = ({ isAdmin, role, uid, year, semester }: { isAdmin: boolean, role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const [studentToManage, setStudentToManage] = useState<any>(null);
  const [opsConfig, setOpsConfig] = useState({ targetYear: year, targetSemester: semester, targetGrade: '', includeLessons: false, includePayments: false, includeAcademic: false, operationType: 'copy' as 'copy' | 'move' });
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (role !== 'admin') query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('is_completed', { ascending: true }).order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e: any) { showFeedback(`فشل تحميل السجل: ${e.message}`, "error"); } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAdvancedOp = async () => {
    if (!studentToManage || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (role !== 'admin' && studentToManage.teacher_id !== uid) throw new Error("عذراً، لا تملك صلاحية.");
      const newStudentData = { name: studentToManage.name, address: studentToManage.address, school_name: studentToManage.school_name, grade: opsConfig.targetGrade || studentToManage.grade, phones: studentToManage.phones, agreed_amount: studentToManage.agreed_amount, is_hourly: studentToManage.is_hourly, price_per_hour: studentToManage.price_per_hour, teacher_id: studentToManage.teacher_id, academic_year: opsConfig.targetYear, semester: opsConfig.targetSemester };
      const { data: newStudent, error: insertError } = await supabase.from('students').insert([newStudentData]).select().single();
      if (insertError) throw insertError;
      const transferPromises: any[] = [];
      if (opsConfig.includeLessons) {
        const { data: l } = await supabase.from('lessons').select('*').eq('student_id', studentToManage.id);
        if (l && l.length > 0) transferPromises.push(supabase.from('lessons').insert(l.map(x => ({ ...x, id: undefined, student_id: newStudent.id, created_at: undefined }))));
      }
      if (opsConfig.includePayments) {
        const { data: p } = await supabase.from('payments').select('*').eq('student_id', studentToManage.id);
        if (p && p.length > 0) transferPromises.push(supabase.from('payments').insert(p.map(x => ({ ...x, id: undefined, student_id: newStudent.id, created_at: undefined }))));
      }
      if (transferPromises.length > 0) await Promise.all(transferPromises);
      if (opsConfig.operationType === 'move') await supabase.from('students').delete().eq('id', studentToManage.id);
      showFeedback("تم تنفيذ العملية بنجاح");
      setIsOpsModalOpen(false); fetchStudents();
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setIsSubmitting(false); }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const studentData = { name: form.name.trim(), grade: form.grade, phones: form.phones, agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0), is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0, teacher_id: uid, academic_year: year, semester: semester };
      if (isEditMode && selectedStudentId) await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      else await supabase.from('students').insert([studentData]);
      setIsModalOpen(false); fetchStudents();
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setIsSubmitting(false); }
  };

  const filteredStudents = useMemo(() => students.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && (selectedGrade === 'الكل' || s.grade === selectedGrade)), [students, searchTerm, selectedGrade]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-right font-['Cairo'] pb-32">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black transition-all animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-12 lg:p-16 rounded-[5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-10 relative z-10">
           <div className="bg-indigo-600 p-8 rounded-[2.8rem] text-white shadow-2xl shadow-indigo-200 rotate-6 group-hover:rotate-0 transition-transform duration-700"><Users size={44}/></div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">قاعدة البيانات الطلابية</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">إدارة {students.length} طلاب مسجلين حالياً</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            <input placeholder="ابحث عن طالب..." className="w-full pr-16 pl-8 py-5 bg-slate-50 rounded-[2rem] font-black border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group/btn">
            <Plus size={24} className="group-hover/btn:rotate-90 transition-transform" /> إضافة طالب
          </button>
        </div>
      </div>

      {/* GRADE TAGS */}
      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 animate-in slide-in-from-right duration-1000">
        {['الكل', '10', '11', '12'].map(grade => (
          <button key={grade} onClick={() => setSelectedGrade(grade)} className={`px-14 py-5 rounded-[2rem] font-black text-sm transition-all whitespace-nowrap border-2 ${selectedGrade === grade ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100 border-indigo-600 translate-y-[-4px]' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}>
            {grade === 'الكل' ? 'كافة المراحل' : `الصف ${grade}`}
          </button>
        ))}
      </div>

      {/* STUDENTS GRID - PREMIUM STYLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-6"><RefreshCw className="animate-spin text-indigo-600" size={60} /><p className="font-black text-slate-300 tracking-widest uppercase">جاري استخراج السجلات...</p></div>
        ) : filteredStudents.map(s => (
          <div key={s.id} className="bg-white p-10 rounded-[4.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div className="cursor-pointer" onClick={() => navigate('/lessons', { state: { studentToOpen: s } })}>
                 <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[180px]">{s.name}</h3>
                 <span className={`inline-block mt-3 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${s.is_hourly ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>الصف {s.grade} - {s.is_hourly ? 'خارجي' : 'فصلي'}</span>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => { setStudentToManage(s); setIsOpsModalOpen(true); }} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Settings size={22}/></button>
                 <button onClick={() => { if(confirm('حذف؟')) supabase.from('students').delete().eq('id', s.id).then(() => fetchStudents()); }} className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={22}/></button>
               </div>
            </div>

            <div className="space-y-4 mb-10 relative z-10 flex-1">
               {s.phones?.slice(0, 1).map((p: any, i: number) => (
                 <div key={i} className="flex items-center gap-4 text-xs font-black text-slate-500 bg-slate-50/50 p-5 rounded-[1.8rem] border border-slate-100/50">
                    <Phone size={18} className="text-indigo-400" />
                    <span className="tracking-widest">{p.number} ({p.label})</span>
                 </div>
               ))}
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-between items-center relative z-10">
               <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">المستحق المالي</p>
                  <p className={`text-3xl font-black tracking-tighter ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ${(s.remaining_balance || 0).toLocaleString()}
                  </p>
               </div>
               <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className="bg-slate-900 text-white p-5 rounded-[1.8rem] group-hover:bg-indigo-600 hover:scale-110 transition-all shadow-xl shadow-indigo-100">
                 <ChevronLeft size={24} className="rotate-180" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADVANCED OPS MODAL - CENTERED GLASS STYLE */}
      {isOpsModalOpen && studentToManage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[500] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl p-12 lg:p-16 rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-500 overflow-y-auto max-h-[95vh] no-scrollbar border border-white/20">
              <button onClick={() => setIsOpsModalOpen(false)} className="absolute top-12 left-12 text-slate-300 hover:text-rose-500 transition-all hover:rotate-90 duration-500"><X size={44}/></button>
              
              <div className="flex flex-col items-center text-center mb-14">
                 <div className="bg-gradient-to-tr from-indigo-700 to-indigo-500 p-8 rounded-[2.8rem] text-white shadow-2xl shadow-indigo-200 mb-8"><ArrowRightLeft size={44}/></div>
                 <h2 className="text-4xl font-black text-slate-900 leading-tight">ترحيل وتحكم ذكي</h2>
                 <p className="text-indigo-500 font-black text-sm mt-4 uppercase tracking-[0.3em]">الطالب المستهدف: {studentToManage.name}</p>
              </div>

              <div className="space-y-12">
                 <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => setOpsConfig({...opsConfig, operationType: 'copy'})} className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-5 ${opsConfig.operationType === 'copy' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                       <Copy size={32}/>
                       <span className="font-black text-lg">نسخ السجل</span>
                    </button>
                    <button onClick={() => setOpsConfig({...opsConfig, operationType: 'move'})} className={`p-10 rounded-[3rem] border-4 transition-all flex flex-col items-center gap-5 ${opsConfig.operationType === 'move' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                       <ArrowRightLeft size={32}/>
                       <span className="font-black text-lg">نقل الطالب</span>
                    </button>
                 </div>

                 <div className="bg-slate-50 p-10 rounded-[3.5rem] border-2 border-slate-100 space-y-8">
                    <div className="flex items-center gap-4 text-slate-400"><Database size={20}/> <span className="text-[11px] font-black uppercase tracking-[0.2em]">تحديد الوجهة الجديدة</span></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                       <select className="p-5 bg-white border-none rounded-2xl font-black text-xs outline-none shadow-sm cursor-pointer" value={opsConfig.targetYear} onChange={e => setOpsConfig({...opsConfig, targetYear: e.target.value})}>
                          <option value="2025-2026">2025-2026</option><option value="2026-2027">2026-2027</option>
                       </select>
                       <select className="p-5 bg-white border-none rounded-2xl font-black text-xs outline-none shadow-sm cursor-pointer" value={opsConfig.targetSemester} onChange={e => setOpsConfig({...opsConfig, targetSemester: e.target.value})}>
                          <option value="1">الفصل 1</option><option value="2">الفصل 2</option>
                       </select>
                       <select className="p-5 bg-white border-none rounded-2xl font-black text-xs outline-none shadow-sm cursor-pointer" value={opsConfig.targetGrade} onChange={e => setOpsConfig({...opsConfig, targetGrade: e.target.value})}>
                          <option value="10">الصف 10</option><option value="11">الصف 11</option><option value="12">الصف 12</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-3 px-6"><Sparkles size={18} className="text-amber-500"/><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">اختيار البيانات المرفقة</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <label className="flex items-center justify-between p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] cursor-pointer hover:border-indigo-600 transition-all group">
                          <span className="font-black text-slate-700 text-sm">سجل الحصص</span>
                          <input type="checkbox" className="w-8 h-8 accent-indigo-600 rounded-xl" checked={opsConfig.includeLessons} onChange={e => setOpsConfig({...opsConfig, includeLessons: e.target.checked})} />
                       </label>
                       <label className="flex items-center justify-between p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] cursor-pointer hover:border-indigo-600 transition-all group">
                          <span className="font-black text-slate-700 text-sm">سجل المالية</span>
                          <input type="checkbox" className="w-8 h-8 accent-indigo-600 rounded-xl" checked={opsConfig.includePayments} onChange={e => setOpsConfig({...opsConfig, includePayments: e.target.checked})} />
                       </label>
                    </div>
                 </div>

                 <button disabled={isSubmitting} onClick={handleAdvancedOp} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[2.8rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-5 active:scale-95 text-xl disabled:opacity-50">
                    {isSubmitting ? <RefreshCw className="animate-spin" /> : <HardDriveDownload size={32}/>}
                    {opsConfig.operationType === 'copy' ? 'تأكيد النسخ' : 'تأكيد الترحيل'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ADD/EDIT MODAL - CLEAN & WIDE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[500] flex items-center justify-center p-6">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-3xl p-14 lg:p-20 rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[95vh] overflow-y-auto no-scrollbar border border-white/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-14 left-14 text-slate-300 hover:text-rose-500 transition-all"><X size={44}/></button>
            <h2 className="text-4xl font-black mb-16 text-slate-900 flex items-center gap-6">
              <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-2xl"><Plus size={32}/></div>
              {isEditMode ? 'تحديث السجل' : 'إضافة طالب للقائمة'}
            </h2>
            
            <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">الاسم الثلاثي المعتمد</label>
                    <input required placeholder="اكتب الاسم هنا..." className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-lg outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">المرحلة الدراسية</label>
                    <select className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-lg outline-none cursor-pointer" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       <option value="10">الصف العاشر</option><option value="11">الصف الحادي عشر</option><option value="12">الصف الثاني عشر</option>
                    </select>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 mr-6 uppercase tracking-widest">أرقام التواصل (للتنبيهات)</label>
                  {form.phones.map((phone, index) => (
                    <div key={index} className="flex gap-5 animate-in slide-in-from-right duration-500">
                       <input placeholder="رقم الهاتف..." className="flex-1 p-6 bg-slate-50 rounded-[2.2rem] font-black text-xl text-left tracking-[0.2em] outline-none border-2 border-transparent focus:border-indigo-100 transition-all" value={phone.number} onChange={e => {
                         const n = [...form.phones]; n[index].number = e.target.value; setForm({...form, phones: n});
                       }} />
                       <select className="p-6 bg-slate-50 rounded-[2.2rem] font-black text-[12px] min-w-[120px]" value={phone.label} onChange={e => {
                         const n = [...form.phones]; n[index].label = e.target.value; setForm({...form, phones: n});
                       }}>
                          <option>الطالب</option><option>الأب</option><option>الأم</option>
                       </select>
                    </div>
                  ))}
               </div>

               <div className="p-12 bg-indigo-50/50 rounded-[4rem] space-y-8 border-4 border-dashed border-indigo-100">
                  <div className="flex items-center gap-6">
                    <input type="checkbox" id="h" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-10 h-10 accent-indigo-600 cursor-pointer rounded-xl" />
                    <label htmlFor="h" className="font-black text-slate-700 text-lg cursor-pointer">محاسبة بنظام الساعة (طالب خارجي)</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة الواحدة ($)" className="w-full p-8 bg-white rounded-[2.5rem] font-black text-center text-4xl text-indigo-600 shadow-2xl shadow-indigo-100 outline-none" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="المبلغ المقطوع للفصل ($)" className="w-full p-8 bg-white rounded-[2.5rem] font-black text-center text-4xl text-slate-900 shadow-2xl shadow-slate-200 outline-none" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
            </div>

            <button disabled={isSubmitting} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[3rem] mt-16 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-5 active:scale-95 text-2xl group/save">
              {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={32} className="group-hover/save:scale-110 transition-transform" />}
              تأكيد وحفظ البيانات
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
