
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { 
  Calendar, Clock, BookOpen, ChevronLeft, Plus, Info, 
  Wallet, MessageCircle, School, Star, Target, TrendingUp, X, Trash2, CheckCircle, AlertCircle, History, DollarSign, Folder, FolderOpen
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'payments' | 'academic'>('lessons');
  const [selectedGradeFolder, setSelectedGradeFolder] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'كاش', payment_number: 'الأولى', is_final: false, notes: ''
  });

  const [academicForm, setAcademicForm] = useState({ status_notes: '', weaknesses: '' });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchStudents = useCallback(async () => {
    let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
    if (role !== 'admin') query = query.eq('teacher_id', uid);
    const { data } = await query.order('name');
    setStudents(data || []);
  }, [uid, role, year, semester]);

  const fetchRecords = async (sid: string) => {
    setLoading(true);
    try {
      const [l, p, a] = await Promise.all([
        supabase.from('lessons').select('*').eq('student_id', sid).order('lesson_date', { ascending: false }),
        supabase.from('payments').select('*').eq('student_id', sid).order('payment_date', { ascending: false }),
        supabase.from('academic_records').select('*').eq('student_id', sid).order('created_at', { ascending: false })
      ]);
      setStudentLessons(l.data || []);
      setStudentPayments(p.data || []);
      setAcademicRecords(a.data || []);
    } catch (e) {
      showFeedback("خطأ في جلب السجلات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { 
    if (selectedStudent) {
      fetchRecords(selectedStudent.id);
      const updated = students.find(s => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  }, [selectedStudent?.id, students]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('payments').insert([{
        ...paymentForm, 
        amount: parseFloat(paymentForm.amount), 
        student_id: selectedStudent.id, 
        teacher_id: uid
      }]);
      if (error) throw error;
      showFeedback("تم تسجيل الدفعة بنجاح");
      setIsModalOpen(false); 
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'كاش', payment_number: 'الأولى', is_final: false, notes: '' });
      await fetchStudents();
    } catch (err: any) { showFeedback(err.message, "error"); }
  };

  const handleAddAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('academic_records').insert([{
        ...academicForm, student_id: selectedStudent.id, teacher_id: uid
      }]);
      if (error) throw error;
      showFeedback("تم حفظ الملاحظات الدراسية");
      setAcademicForm({ status_notes: '', weaknesses: '' }); 
      fetchRecords(selectedStudent.id);
    } catch (err: any) { showFeedback(err.message, "error"); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => selectedGradeFolder === 'الكل' || s.grade === selectedGradeFolder);
  }, [students, selectedGradeFolder]);

  const gradeCounts = useMemo(() => {
    const counts: any = { '10': 0, '11': 0, '12': 0, 'الكل': students.length };
    students.forEach(s => { if (counts[s.grade] !== undefined) counts[s.grade]++; });
    return counts;
  }, [students]);

  const averagePrice = selectedStudent && selectedStudent.remaining_balance <= 0 && selectedStudent.total_lessons > 0
    ? (selectedStudent.total_paid / selectedStudent.total_lessons).toFixed(2)
    : null;

  return (
    <div className="space-y-6 text-right pb-20 animate-in fade-in duration-500">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {!selectedStudent ? (
        <div className="space-y-8">
          {/* Folders Navigation */}
          <div className="flex flex-wrap gap-4 animate-in slide-in-from-top duration-700">
            {[
              { id: 'الكل', label: 'كافة الطلاب' },
              { id: '10', label: 'الصف العاشر (10)' },
              { id: '11', label: 'الحادي عشر (11)' },
              { id: '12', label: 'الثاني عشر (12)' },
            ].map((folder) => {
              const isActive = selectedGradeFolder === folder.id;
              const count = gradeCounts[folder.id];
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedGradeFolder(folder.id)}
                  className={`flex-1 min-w-[140px] p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                    isActive ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 shadow-inner'}`}>
                    {isActive ? <FolderOpen size={24} /> : <Folder size={24} />}
                  </div>
                  <div className="text-center">
                    <p className={`text-[11px] font-black ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{folder.label}</p>
                    <p className={`text-[9px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>{count} طالب</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* List of Students in Folder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(s => (
              <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-600 cursor-pointer transition-all shadow-sm group animate-in zoom-in duration-300">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                   <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">الصف {s.grade}</span>
                 </div>
                 <p className="text-xs text-slate-400 font-bold mb-4 flex items-center gap-2"><School size={14}/> {s.school_name || 'بلا مدرسة'}</p>
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">المتبقي</p>
                      <p className={`font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance.toLocaleString()}</p>
                    </div>
                    <ChevronLeft size={18} className="text-indigo-300 group-hover:text-indigo-600 transition-all"/>
                 </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-50">
                <Folder size={64} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-400 font-black text-lg">هذا المجلد لا يحتوي على طلاب مسجلين.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedStudent(null)} className="bg-white text-indigo-600 font-black px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"><ChevronLeft size={18} className="rotate-180"/> العودة للقائمة</button>
          
          <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-right">
                   <h2 className="text-4xl font-black mb-2">{selectedStudent.name}</h2>
                   <div className="flex flex-wrap justify-center md:justify-start gap-4">
                     <p className="text-slate-400 text-sm font-bold flex items-center gap-2"><School size={16}/> {selectedStudent.school_name || 'لم تحدد المدرسة'}</p>
                     <p className="text-slate-400 text-sm font-bold flex items-center gap-2"><Target size={16}/> الصف {selectedStudent.grade}</p>
                   </div>
                   <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-6">
                      {selectedStudent.phones?.map((p:any, i:number) => (
                        <a key={i} href={`https://wa.me/${p.number}`} target="_blank" className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-emerald-500/20 transition-all border border-white/5"><MessageCircle size={14} className="text-emerald-400"/> {p.label}: {p.number}</a>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center backdrop-blur-sm">
                      <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">ميزانية الفصل</p>
                      <p className="text-3xl font-black text-indigo-400">${selectedStudent.expected_income}</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center backdrop-blur-sm">
                      <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">إجمالي المدفوع</p>
                      <p className="text-3xl font-black text-emerald-400">${selectedStudent.total_paid}</p>
                   </div>
                   {averagePrice && (
                     <div className="bg-indigo-600/30 p-6 rounded-[2.5rem] col-span-2 border border-indigo-500/40 flex justify-between items-center px-10 animate-in zoom-in duration-500 shadow-xl shadow-indigo-900/20">
                        <div>
                          <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-1"><Star size={16} className="text-amber-400 fill-amber-400"/> معدل ثمن الحصة الواحدة</p>
                          <p className="text-4xl font-black text-white">${averagePrice}</p>
                        </div>
                        <p className="text-4xl font-black text-white">${averagePrice}</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm no-scrollbar max-w-2xl mx-auto">
             {[
               {id: 'lessons', label: 'سجل الدروس', icon: <BookOpen size={16}/>},
               {id: 'payments', label: 'المالية والدفع', icon: <Wallet size={16}/>},
               {id: 'academic', label: 'المتابعة الدراسية', icon: <Target size={16}/>}
             ].map((t) => (
               <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-xs transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-8 min-h-[500px]">
            {activeTab === 'academic' && (
              <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                 <form onSubmit={handleAddAcademic} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-5">
                    <h4 className="font-black text-slate-900 text-lg flex items-center gap-3"><TrendingUp size={20} className="text-indigo-600"/> تقرير حالة الطالب</h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">ملاحظات عامة عن التقدم الدراسي</label>
                       <textarea required placeholder="اكتب ملاحظاتك عن أداء الطالب في الحصص الأخيرة.." className="w-full p-5 border-2 border-slate-100 rounded-[2rem] h-28 font-bold text-sm focus:border-indigo-500 outline-none transition-all" value={academicForm.status_notes} onChange={e => setAcademicForm({...academicForm, status_notes: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-rose-400 mr-4 uppercase">نقاط الضعف (تحتاج متابعة مكثفة)</label>
                       <textarea required placeholder="مثال: صعوبة في قوانين الحركة، ضعف في النحو.." className="w-full p-5 border-2 border-rose-100 bg-rose-50/20 rounded-[2rem] h-28 font-bold text-sm text-rose-700 focus:border-rose-500 outline-none transition-all" value={academicForm.weaknesses} onChange={e => setAcademicForm({...academicForm, weaknesses: e.target.value})} />
                    </div>
                    <button className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">حفظ التقرير الدراسي</button>
                 </form>

                 <div className="space-y-6">
                   <h3 className="font-black text-slate-900 flex items-center gap-2 px-4"><History size={18}/> السجل الدراسي السابق</h3>
                   {academicRecords.map(r => (
                     <div key={r.id} className="p-8 border border-slate-100 rounded-[3rem] bg-white hover:shadow-xl transition-all relative group">
                        <div className="flex justify-between items-center mb-6">
                           <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full">{new Date(r.created_at).toLocaleDateString('ar-EG', {dateStyle:'full'})}</span>
                           <Target size={20} className="text-indigo-200 group-hover:text-indigo-500 transition-colors"/>
                        </div>
                        <div className="mb-6">
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-2">الحالة الدراسية</p>
                           <p className="font-bold text-slate-700 leading-relaxed">{r.status_notes}</p>
                        </div>
                        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100/50">
                           <p className="text-[11px] font-black text-rose-500 uppercase mb-2 flex items-center gap-2"><AlertCircle size={14}/> نقاط الضعف المسجلة</p>
                           <p className="text-sm font-black text-rose-700">{r.weaknesses}</p>
                        </div>
                     </div>
                   ))}
                   {academicRecords.length === 0 && (
                     <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
                        <Target size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">لا توجد سجلات دراسية محفوظة بعد.</p>
                     </div>
                   )}
                 </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
                  <div>
                    <h3 className="text-xl font-black text-emerald-900 mb-1">الإدارة المالية</h3>
                    <p className="text-xs font-bold text-emerald-600">تسجيل ومراجعة كافة الدفعات النقدية المسددة.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 text-sm">+ تسجيل دفعة نقدية</button>
                </div>

                <div className="space-y-4">
                   {studentPayments.map(p => (
                     <div key={p.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                           <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600 font-black border border-emerald-100 text-xl shadow-inner min-w-[80px] text-center">${p.amount}</div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-black text-slate-900 text-lg">الدفعة {p.payment_number}</p>
                                {p.is_final && <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black shadow-lg shadow-indigo-100">الدفعة الأخيرة</span>}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{p.payment_method}</span>
                                <span>|</span>
                                <span>{new Date(p.payment_date).toLocaleDateString('ar-EG', {dateStyle:'medium'})}</span>
                              </div>
                           </div>
                        </div>
                        {p.notes && <p className="text-xs text-slate-500 font-medium italic bg-slate-50 px-6 py-3 rounded-2xl border border-slate-50 flex-1 text-center md:text-right">{p.notes}</p>}
                     </div>
                   ))}
                   {studentPayments.length === 0 && (
                     <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
                        <Wallet size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">لم يتم استلام أي دفعات مالية من هذا الطالب بعد.</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                  {studentLessons.map(l => (
                    <div key={l.id} className="p-6 border border-slate-100 rounded-[2.5rem] flex justify-between items-center group hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm">
                       <div className="flex items-center gap-5">
                          <div className="bg-slate-50 text-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100"><BookOpen size={24}/></div>
                          <div>
                            <p className="font-black text-slate-900 text-lg">{new Date(l.lesson_date).toLocaleDateString('ar-EG', {dateStyle:'full'})}</p>
                            <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1"><Clock size={12}/> مدة الحصة: {l.hours} ساعة</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  {studentLessons.length === 0 && (
                     <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed">
                        <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">لا يوجد سجل حصص لهذا الطالب حالياً.</p>
                     </div>
                  )}
               </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-right">
          <form onSubmit={handleAddPayment} className="bg-white w-full max-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-10 text-slate-900">تسجيل دفعة نقدية</h2>
            
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">المبلغ المستلم ($)</label>
                 <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input required type="number" className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black text-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">وسيلة الدفع</label>
                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-sm appearance-none focus:bg-white focus:border-indigo-500 outline-none transition-all" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value as any})}>
                       <option value="كاش">كاش (نقدي)</option>
                       <option value="كي نت">كي نت (Knet)</option>
                       <option value="ومض">ومض (Womda)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">رقم الدفعة</label>
                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-sm appearance-none focus:bg-white focus:border-indigo-500 outline-none transition-all" value={paymentForm.payment_number} onChange={e => setPaymentForm({...paymentForm, payment_number: e.target.value})}>
                       <option value="الأولى">الدفعة الأولى</option>
                       <option value="الثانية">الدفعة الثانية</option>
                       <option value="الثالثة">الدفعة الثالثة</option>
                       <option value="الرابعة">الدفعة الرابعة</option>
                       <option value="الخامسة">الدفعة الخامسة</option>
                    </select>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-[2rem] border-2 border-amber-100/50">
                  <input type="checkbox" className="w-6 h-6 rounded accent-amber-600" checked={paymentForm.is_final} onChange={e => setPaymentForm({...paymentForm, is_final: e.target.checked})} />
                  <div>
                    <label className="text-xs font-black text-amber-800">هل هذه هي الدفعة الأخيرة؟</label>
                    <p className="text-[9px] text-amber-600 font-bold">عند اختيارها، سيتم تمييز الدفعة في السجل المالي.</p>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">ملاحظات إضافية</label>
                  <textarea placeholder="مثال: تسوية حساب شهر كذا.." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold h-24 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
               </div>
            </div>

            <button className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl mt-8 shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 text-lg">تأكيد استلام المبلغ</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-400 font-bold mt-2 hover:text-rose-500 transition-colors">إغلاق النافذة</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
