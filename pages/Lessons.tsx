
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Calendar, Clock, BookOpen, ChevronLeft, Plus, Info, 
  Wallet, MessageCircle, School, Star, Target, TrendingUp, X, Trash2, CheckCircle, AlertCircle, History, DollarSign, Folder, FolderOpen, RefreshCw, FileText, Save
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(location.state?.studentToOpen || null);
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
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (role !== 'admin') query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e) {
      console.error("Error fetching students:", e);
    }
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
      console.error("Error fetching records:", e);
      showFeedback("خطأ في جلب بيانات الطالب", "error");
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
    setIsSubmitting(true);
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
      fetchStudents();
      fetchRecords(selectedStudent.id);
    } catch (err: any) { showFeedback(err.message, "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      fetchStudents();
      fetchRecords(selectedStudent.id);
    } catch (err: any) { showFeedback(err.message, "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleAddAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicForm.status_notes.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('academic_records').insert([{
        status_notes: academicForm.status_notes,
        weaknesses: academicForm.weaknesses,
        student_id: selectedStudent.id,
        teacher_id: uid
      }]);
      if (error) throw error;
      showFeedback("تم حفظ المتابعة الدراسية بنجاح");
      setAcademicForm({ status_notes: '', weaknesses: '' }); 
      fetchRecords(selectedStudent.id);
    } catch (err: any) { 
      console.error(err);
      showFeedback("حدث خطأ أثناء حفظ المتابعة", "error"); 
    }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteAcademic = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقرير؟")) return;
    try {
      const { error } = await supabase.from('academic_records').delete().eq('id', id);
      if (error) throw error;
      fetchRecords(selectedStudent.id);
    } catch (e: any) { showFeedback("فشل الحذف", "error"); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => selectedGradeFolder === 'الكل' || s.grade === selectedGradeFolder);
  }, [students, selectedGradeFolder]);

  return (
    <div className="space-y-6 text-right pb-20 animate-in fade-in duration-500 font-['Cairo']">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white animate-bounce`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {!selectedStudent ? (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-4 animate-in slide-in-from-top duration-700">
            {['الكل', '10', '11', '12'].map((folder) => (
                <button
                  key={folder}
                  onClick={() => setSelectedGradeFolder(folder)}
                  className={`flex-1 min-w-[140px] p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${selectedGradeFolder === folder ? 'border-indigo-600 bg-white shadow-xl' : 'border-slate-100 bg-white shadow-sm'}`}
                >
                  <div className={`p-3 rounded-2xl ${selectedGradeFolder === folder ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {selectedGradeFolder === folder ? <FolderOpen size={24} /> : <Folder size={24} />}
                  </div>
                  <p className="text-[11px] font-black">{folder === 'الكل' ? 'كافة الطلاب' : `الصف ${folder}`}</p>
                </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(s => (
              <button key={s.id} onClick={() => setSelectedStudent(s)} className="block w-full text-right bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-600 transition-all shadow-sm group">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600">{s.name}</h3>
                   <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">الصف {s.grade}</span>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group-hover:bg-indigo-50">
                    <p className={`font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${(s.remaining_balance || 0).toLocaleString()}</p>
                    <ChevronLeft size={18} className="text-indigo-300"/>
                 </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in duration-500">
          <button onClick={() => setSelectedStudent(null)} className="bg-white text-indigo-600 font-black px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all"><ChevronLeft size={18} className="rotate-180"/> العودة لقائمة الطلاب</button>
          
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12"></div>
              <div className="text-center md:text-right relative z-10">
                 <h2 className="text-3xl font-black mb-1">{selectedStudent.name}</h2>
                 <p className="text-indigo-300 text-sm font-bold">المرحلة: الصف {selectedStudent.grade}</p>
              </div>
              <div className="flex gap-4 relative z-10">
                 <div className="bg-white/10 p-4 rounded-2xl text-center min-w-[100px] backdrop-blur-md border border-white/5">
                    <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">إجمالي الحصص</p>
                    <p className="text-2xl font-black">{selectedStudent.total_lessons || 0}</p>
                 </div>
                 <div className="bg-white/10 p-4 rounded-2xl text-center min-w-[100px] backdrop-blur-md border border-white/5">
                    <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">المبلغ المتبقي</p>
                    <p className="text-2xl font-black text-rose-400">${(selectedStudent.remaining_balance || 0).toLocaleString()}</p>
                 </div>
              </div>
          </div>

          <div className="flex gap-2 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-xl max-w-lg mx-auto overflow-hidden">
             {[
               {id: 'lessons', label: 'سجل الحصص', icon: <BookOpen size={16}/>},
               {id: 'payments', label: 'المركز المالي', icon: <Wallet size={16}/>},
               {id: 'academic', label: 'المتابعة التدريسية', icon: <Target size={16}/>}
             ].map((t) => (
               <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] font-black text-[11px] transition-all duration-300 ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100 scale-105' : 'text-slate-500 hover:bg-slate-50'}`}>
                 {t.icon} {t.label}
               </button>
             ))}
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-8 lg:p-12">
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                  <h3 className="text-lg font-black text-indigo-900">سجل الحصص المنفذة</h3>
                  <button onClick={() => setIsLessonModalOpen(true)} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all text-xs">+ تسجيل حصة جديدة</button>
                </div>
                <div className="space-y-3">
                  {studentLessons.map(l => (
                    <div key={l.id} className="p-5 border border-slate-50 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition-all group border-r-4 border-r-indigo-500 shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl"><Calendar size={20}/></div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{l.lesson_date}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{l.hours} ساعة تدريسية | {l.notes || 'لا توجد ملاحظات إضافية'}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  {studentLessons.length === 0 && <p className="text-center py-12 text-slate-300 font-bold italic">لا توجد حصص مسجلة حالياً.</p>}
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-12">
                 <form onSubmit={handleAddAcademic} className="bg-slate-50/80 p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 space-y-8 shadow-inner">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><FileText size={24}/></div>
                      <h4 className="font-black text-slate-900 text-xl">إضافة تقرير متابعة جديد</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">المستوى الدراسي والتقدم</label>
                          <textarea required placeholder="اكتب وصفاً لمستوى الطالب في الحصص الأخيرة..." className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] h-32 font-bold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value={academicForm.status_notes} onChange={e => setAcademicForm({...academicForm, status_notes: e.target.value})} />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">نقاط الضعف المطلوب معالجتها</label>
                          <textarea placeholder="مثال: صعوبة في استيعاب مفاهيم الكيمياء العضوية..." className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] h-32 font-bold text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value={academicForm.weaknesses} onChange={e => setAcademicForm({...academicForm, weaknesses: e.target.value})} />
                       </div>
                    </div>
                    {/* Fixed: Added missing 'Save' icon from lucide-react. */}
                    <button disabled={isSubmitting || !academicForm.status_notes.trim()} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                      {isSubmitting ? <RefreshCw className="animate-spin"/> : <Save size={20}/>}
                      حفظ تقرير المتابعة
                    </button>
                 </form>

                 <div className="space-y-8">
                   <div className="flex items-center gap-3 border-b pb-6">
                     <History size={20} className="text-indigo-400"/>
                     <h4 className="font-black text-slate-900 text-lg">سجل المتابعة التدريسية السابقة</h4>
                   </div>
                   <div className="grid grid-cols-1 gap-6">
                     {academicRecords.map((rec) => (
                       <div key={rec.id} className="bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] relative group hover:border-indigo-100 transition-all shadow-sm">
                          <button onClick={() => handleDeleteAcademic(rec.id)} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 p-2"><Trash2 size={18}/></button>
                          <div className="flex items-center gap-3 mb-6 text-indigo-600 bg-indigo-50 w-fit px-4 py-1.5 rounded-full">
                             <Calendar size={14} />
                             <span className="text-[11px] font-black">{new Date(rec.created_at).toLocaleDateString('ar-EG', { dateStyle: 'full' })}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Star size={12} className="text-amber-500"/> ملاحظات المعلم</p>
                               <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100">{rec.status_notes}</p>
                             </div>
                             {rec.weaknesses && (
                               <div>
                                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertCircle size={12}/> نقاط الضعف</p>
                                 <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                                   <p className="text-sm font-bold text-rose-800 leading-relaxed">{rec.weaknesses}</p>
                                 </div>
                               </div>
                             )}
                          </div>
                       </div>
                     ))}
                     {academicRecords.length === 0 && (
                       <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                         <Target size={48} className="mx-auto text-slate-200 mb-4" />
                         <p className="text-slate-400 font-black text-lg italic">لا توجد سجلات متابعة سابقة لهذا الطالب.</p>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                   <h3 className="text-lg font-black text-emerald-900">سجل التحصيل المالي</h3>
                   <button onClick={() => setIsPaymentModalOpen(true)} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all text-xs">+ تسجيل دفعة نقدية</button>
                 </div>
                 <div className="space-y-3">
                   {studentPayments.map(p => (
                     <div key={p.id} className="p-5 border border-slate-50 rounded-2xl flex justify-between items-center group border-r-4 border-r-emerald-500 shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl font-black text-lg shadow-inner">${p.amount}</div>
                           <div>
                             <p className="font-black text-slate-900 text-sm">الدفعة {p.payment_number || 'الأولى'}</p>
                             <p className="text-[10px] text-slate-400 font-bold mt-1">{p.payment_date} | عبر {p.payment_method}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                   {studentPayments.length === 0 && <p className="text-center py-12 text-slate-300 font-bold italic">لا توجد مدفوعات مسجلة بعد.</p>}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-right animate-in fade-in duration-300">
          <form onSubmit={handleAddLesson} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">تسجيل حصة درسية</h2>
            <div className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">تاريخ الحصة</label>
                  <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 transition-all" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">عدد الساعات</label>
                  <input required type="number" step="0.5" placeholder="عدد الساعات" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 transition-all" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">ملاحظات إضافية</label>
                  <textarea placeholder="ملاحظات الحصة.." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold h-24 outline-none focus:border-indigo-500 transition-all" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
               </div>
               <button disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                 {isSubmitting ? "جاري الحفظ..." : "تأكيد تسجيل الحصة"}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-right animate-in fade-in duration-300">
          <form onSubmit={handleAddPayment} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-8 text-emerald-900">تسجيل دفعة نقدية</h2>
            <div className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">المبلغ ($)</label>
                  <input required type="number" placeholder="المبلغ ($)" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl text-center outline-none focus:border-emerald-500 transition-all" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">الوسيلة</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                        <option>كاش</option>
                        <option>كي نت</option>
                        <option>ومض</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">رقم الدفعة</label>
                     <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" value={paymentForm.payment_number} onChange={e => setPaymentForm({...paymentForm, payment_number: e.target.value})}>
                        <option>الأولى</option>
                        <option>الثانية</option>
                        <option>الثالثة</option>
                        <option>الأخيرة</option>
                     </select>
                  </div>
               </div>
               <button disabled={isSubmitting} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 disabled:opacity-50 transition-all">
                 {isSubmitting ? "جاري التسجيل..." : "تأكيد استلام المبلغ"}
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
