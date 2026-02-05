import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Calendar, Clock, BookOpen, ChevronLeft, Plus, Info, 
  Wallet, MessageCircle, School, Star, Target, TrendingUp, X, Trash2, CheckCircle, AlertCircle, History, DollarSign, Folder, FolderOpen, RefreshCw
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
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [lessonForm, setLessonForm] = useState({
    lesson_date: new Date().toISOString().split('T')[0],
    hours: '2',
    notes: ''
  });

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

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('lessons').insert([{
        student_id: selectedStudent.id,
        teacher_id: uid,
        lesson_date: lessonForm.lesson_date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      }]);
      if (error) throw error;
      showFeedback("تم تسجيل الحصة بنجاح");
      setIsLessonModalOpen(false);
      setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '2', notes: '' });
      await fetchStudents(); // Refresh balance
      await fetchRecords(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
      setIsPaymentModalOpen(false); 
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
    <div className="space-y-6 text-right pb-20 animate-in fade-in duration-500 font-['Cairo']">
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
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center backdrop-blur-sm">
                      <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">إجمالي الحصص</p>
                      <p className="text-3xl font-black text-indigo-400">{selectedStudent.total_lessons}</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center backdrop-blur-sm">
                      <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">المبلغ المتبقي</p>
                      <p className="text-3xl font-black text-rose-400">${selectedStudent.remaining_balance}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm no-scrollbar max-w-2xl mx-auto">
             {[
               {id: 'lessons', label: 'سجل الدروس', icon: <BookOpen size={16}/>},
               {id: 'payments', label: 'المالية والدفع', icon: <Wallet size={16}/>},
               {id: 'academic', label: 'المتابعة الدراسية', icon: <Target size={16}/>}
             ].map((t) => (
               <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-xs transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-8 min-h-[500px]">
            {activeTab === 'lessons' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-indigo-900">سجل الحصص المنفذة</h3>
                    <p className="text-[10px] font-bold text-indigo-400">سجل كافة الدروس التي تم إعطاؤها للطالب.</p>
                  </div>
                  <button 
                    onClick={() => setIsLessonModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 text-xs"
                  >
                    <Plus size={18}/> تسجيل حصة جديدة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentLessons.map(l => (
                    <div key={l.id} className="p-5 border border-slate-100 rounded-[2rem] flex justify-between items-center group hover:bg-slate-50 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="bg-slate-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><BookOpen size={20}/></div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{new Date(l.lesson_date).toLocaleDateString('ar-EG', {dateStyle:'full'})}</p>
                            <p className="text-[10px] text-slate-400 font-bold">المدة: {l.hours} ساعة</p>
                          </div>
                       </div>
                       {/* Fix: Wrap icon in span to handle native title tooltip since icons don't support it directly */}
                       {l.notes && (
                         <span title={l.notes}>
                           <Info size={16} className="text-slate-200 group-hover:text-indigo-300" />
                         </span>
                       )}
                    </div>
                  ))}
                  {studentLessons.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold">لا توجد حصص مسجلة بعد.</div>
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
                  <button onClick={() => setIsPaymentModalOpen(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 text-sm">+ تسجيل دفعة نقدية</button>
                </div>
                <div className="space-y-4">
                   {studentPayments.map(p => (
                     <div key={p.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                           <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600 font-black border border-emerald-100 text-xl shadow-inner min-w-[80px] text-center">${p.amount}</div>
                           <div>
                              <p className="font-black text-slate-900 text-lg">الدفعة {p.payment_number}</p>
                              <p className="text-[11px] text-slate-400 font-bold">{p.payment_date}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                 <form onSubmit={handleAddAcademic} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-5">
                    <h4 className="font-black text-slate-900 text-lg flex items-center gap-3"><TrendingUp size={20} className="text-indigo-600"/> تقرير حالة الطالب</h4>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">ملاحظات عامة</label>
                       <textarea required placeholder="اكتب ملاحظاتك..." className="w-full p-5 border rounded-[2rem] h-28 font-bold text-sm focus:border-indigo-500 outline-none transition-all" value={academicForm.status_notes} onChange={e => setAcademicForm({...academicForm, status_notes: e.target.value})} />
                    </div>
                    <button className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">حفظ التقرير الدراسي</button>
                 </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-right">
          <form onSubmit={handleAddLesson} className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-10 text-slate-900">تسجيل حصة درسية</h2>
            
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">تاريخ الحصة</label>
                 <input required type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">عدد الساعات / المدة</label>
                  <div className="flex gap-2">
                    {['1', '1.5', '2', '2.5', '3'].map(h => (
                      <button 
                        key={h} 
                        type="button" 
                        onClick={() => setLessonForm({...lessonForm, hours: h})}
                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${lessonForm.hours === h ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        {h} س
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">ملاحظات عما تم شرحه (اختياري)</label>
                  <textarea placeholder="مثال: شرح قوانين الحركة، حل مسائل صفحة 20.." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold h-24 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
               </div>
            </div>

            <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl mt-8 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-lg">
              {loading ? <RefreshCw className="animate-spin mx-auto" /> : "تأكيد تسجيل الحصة"}
            </button>
          </form>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-right">
          <form onSubmit={handleAddPayment} className="bg-white w-full max-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-10 text-slate-900">تسجيل دفعة نقدية</h2>
            
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">المبلغ المستلم ($)</label>
                 <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input required type="number" className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black text-2xl focus:bg-white focus:border-emerald-500 outline-none transition-all" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                 </div>
               </div>
               <button className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl mt-8 shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 text-lg">تأكيد استلام المبلغ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;