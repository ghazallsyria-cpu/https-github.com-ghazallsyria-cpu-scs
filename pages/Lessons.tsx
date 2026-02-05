
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Calendar, Clock, BookOpen, ChevronLeft, Plus, Info, 
  Wallet, MessageCircle, School, Star, Target, TrendingUp, X, Trash2, CheckCircle, AlertCircle, History, DollarSign, Folder, FolderOpen, RefreshCw, FileText, Save, Edit3, BarChart3, Zap, Activity
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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
  const [activeTab, setActiveTab] = useState<'lessons' | 'payments' | 'academic' | 'stats'>('lessons');
  const [selectedGradeFolder, setSelectedGradeFolder] = useState<string>('الكل');
  
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [lessonForm, setLessonForm] = useState({
    lesson_date: new Date().toISOString().split('T')[0],
    hours: '2',
    notes: ''
  });

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

  const handleOpenAddLesson = () => {
    setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '2', notes: '' });
    setIsEditMode(false);
    setSelectedLessonId(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: any) => {
    setLessonForm({
      lesson_date: lesson.lesson_date,
      hours: lesson.hours.toString(),
      notes: lesson.notes || ''
    });
    setIsEditMode(true);
    setSelectedLessonId(lesson.id);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        student_id: selectedStudent.id,
        teacher_id: uid,
        lesson_date: lessonForm.lesson_date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      };

      if (isEditMode && selectedLessonId) {
        await supabase.from('lessons').update(payload).eq('id', selectedLessonId);
        showFeedback("تم تحديث الحصة بنجاح");
      } else {
        await supabase.from('lessons').insert([payload]);
        showFeedback("تم تسجيل الحصة بنجاح");
      }
      setIsLessonModalOpen(false);
      fetchStudents();
      fetchRecords(selectedStudent.id);
    } catch (err: any) { showFeedback(err.message, "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل التعليمي؟")) return;
    try {
      await supabase.from('lessons').delete().eq('id', id);
      showFeedback("تم حذف الحصة");
      fetchStudents();
      fetchRecords(selectedStudent.id);
    } catch (e) { showFeedback("فشل الحذف", "error"); }
  };

  // بيانات الرسم البياني لإحصائيات الطالب
  const chartData = useMemo(() => {
    const sorted = [...studentLessons].reverse();
    return sorted.slice(-7).map(l => ({
      name: new Date(l.lesson_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      hours: l.hours
    }));
  }, [studentLessons]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => selectedGradeFolder === 'الكل' || s.grade === selectedGradeFolder);
  }, [students, selectedGradeFolder]);

  return (
    <div className="space-y-10 text-right pb-32 animate-in fade-in duration-700 font-['Cairo']">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {!selectedStudent ? (
        <div className="space-y-12">
          {/* FOLDERS HEADER */}
          <div className="bg-white p-12 rounded-[5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="flex items-center gap-8">
                <div className="bg-indigo-600 p-6 rounded-[2.2rem] text-white shadow-2xl"><BookOpen size={40}/></div>
                <div>
                  <h1 className="text-4xl font-black text-slate-900 leading-tight">مركز المتابعة اليومية</h1>
                  <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">اختر طالباً للبدء في تتبع الحصص والنمو</p>
                </div>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
               {['الكل', '10', '11', '12'].map((grade) => (
                  <button key={grade} onClick={() => setSelectedGradeFolder(grade)} className={`px-10 py-4 rounded-[1.8rem] font-black text-xs transition-all border-2 ${selectedGradeFolder === grade ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-50 hover:bg-white'}`}>
                    {grade === 'الكل' ? 'الكل' : `الصف ${grade}`}
                  </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.map(s => (
              <button key={s.id} onClick={() => setSelectedStudent(s)} className="block w-full text-right bg-white p-10 rounded-[4.5rem] border border-slate-100 hover:border-indigo-600 transition-all shadow-sm hover:shadow-2xl group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="flex justify-between items-start mb-6">
                   <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                   <span className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">الصف {s.grade}</span>
                 </div>
                 <div className="bg-slate-50/50 p-6 rounded-[2rem] flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-black uppercase mb-1">المتبقي المالي</span>
                      <p className={`text-xl font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${(s.remaining_balance || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col text-left">
                       <span className="text-[10px] text-slate-400 font-black uppercase mb-1">الحصص</span>
                       <p className="text-xl font-black text-slate-900">{s.total_lessons || 0}</p>
                    </div>
                 </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in duration-500">
          <button onClick={() => setSelectedStudent(null)} className="bg-white text-indigo-600 font-black px-10 py-5 rounded-[2.2rem] border-2 border-indigo-50 flex items-center gap-4 shadow-xl hover:bg-slate-50 transition-all active:scale-95 text-sm">
            <ChevronLeft size={24} className="rotate-180"/> العودة لمركز الطلاب
          </button>
          
          {/* STUDENT HERO CARD */}
          <div className="bg-[#1E1B4B] p-12 lg:p-16 rounded-[5.5rem] text-white shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden group">
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
              <div className="text-center lg:text-right relative z-10">
                 <div className="flex items-center gap-4 mb-6 justify-center lg:justify-start">
                    <span className="bg-indigo-600/30 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-xl border border-white/10">ملف الطالب الذكي</span>
                    <Zap size={18} className="text-amber-400 animate-pulse" />
                 </div>
                 <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tighter">{selectedStudent.name}</h2>
                 <p className="text-indigo-300 text-xl font-black flex items-center gap-3 justify-center lg:justify-start"><School size={22}/> طالب مسجل - الصف {selectedStudent.grade}</p>
              </div>
              <div className="flex gap-6 relative z-10 w-full lg:w-auto">
                 <div className="flex-1 lg:flex-none bg-white/5 p-8 rounded-[3rem] text-center min-w-[150px] backdrop-blur-xl border border-white/10 shadow-inner group-hover:-translate-y-2 transition-transform duration-700">
                    <p className="text-[10px] text-indigo-400 font-black mb-3 uppercase tracking-widest">إنجاز الحصص</p>
                    <p className="text-5xl font-black">{selectedStudent.total_lessons || 0}</p>
                 </div>
                 <div className="flex-1 lg:flex-none bg-white/5 p-8 rounded-[3rem] text-center min-w-[150px] backdrop-blur-xl border border-white/10 shadow-inner group-hover:-translate-y-2 transition-transform duration-700">
                    <p className="text-[10px] text-rose-400 font-black mb-3 uppercase tracking-widest">المتبقي ($)</p>
                    <p className="text-5xl font-black text-rose-400">${(selectedStudent.remaining_balance || 0).toLocaleString()}</p>
                 </div>
              </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-3 p-3 bg-white rounded-[3rem] border border-slate-100 shadow-2xl max-w-2xl mx-auto overflow-hidden">
             {[
               {id: 'lessons', label: 'سجل الحصص', icon: <BookOpen size={20}/>},
               {id: 'stats', label: 'الذكاء الإحصائي', icon: <BarChart3 size={20}/>},
               {id: 'academic', label: 'المتابعة', icon: <Target size={20}/>},
               {id: 'payments', label: 'المالية', icon: <Wallet size={20}/>}
             ].map((t) => (
               <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-3 py-5 rounded-[2.2rem] font-black text-[12px] transition-all duration-500 ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}>
                 {t.icon} <span className="hidden md:inline">{t.label}</span>
               </button>
             ))}
          </div>

          {/* CONTENT AREA */}
          <div className="bg-white rounded-[6rem] border border-slate-100 shadow-2xl p-12 lg:p-20">
            {activeTab === 'lessons' && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-50 pb-10">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900">سجل النشاط التعليمي</h3>
                    <p className="text-slate-400 font-bold text-sm mt-2">استعراض كافة الحصص المنفذة وتعديلها</p>
                  </div>
                  <button onClick={handleOpenAddLesson} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 text-lg active:scale-95">
                    <Plus size={24}/> تسجيل حصة جديدة
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {studentLessons.map(l => (
                    <div key={l.id} className="p-10 bg-slate-50/50 border-2 border-slate-50 rounded-[3.5rem] flex flex-col lg:flex-row justify-between items-center gap-8 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all group">
                       <div className="flex items-center gap-8 w-full">
                          <div className="bg-indigo-600 text-white p-6 rounded-[2.2rem] shadow-2xl group-hover:scale-110 transition-transform"><Calendar size={32}/></div>
                          <div className="flex-1">
                            <p className="text-2xl font-black text-slate-900">{new Date(l.lesson_date).toLocaleDateString('ar-EG', { dateStyle: 'full' })}</p>
                            <div className="flex items-center gap-4 mt-3">
                               <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-5 py-1.5 rounded-full flex items-center gap-2"><Clock size={14}/> {l.hours} ساعة تدريسية</span>
                               <span className="text-xs text-slate-400 font-bold italic truncate max-w-[200px]">{l.notes || 'لا يوجد ملاحظات'}</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex gap-4 w-full lg:w-auto border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-100">
                          <button onClick={() => handleOpenEditLesson(l)} className="flex-1 lg:flex-none p-5 bg-white text-indigo-600 rounded-[1.8rem] hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-50 flex items-center justify-center gap-3">
                            <Edit3 size={20}/> <span className="lg:hidden font-black">تعديل</span>
                          </button>
                          <button onClick={() => handleDeleteLesson(l.id)} className="flex-1 lg:flex-none p-5 bg-rose-50 text-rose-500 rounded-[1.8rem] hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100 flex items-center justify-center gap-3">
                            <Trash2 size={20}/> <span className="lg:hidden font-black">حذف</span>
                          </button>
                       </div>
                    </div>
                  ))}
                  {studentLessons.length === 0 && (
                    <div className="col-span-full py-32 text-center flex flex-col items-center gap-6 opacity-30">
                      <BookOpen size={80} className="text-slate-300" />
                      <p className="text-2xl font-black">لم يتم تسجيل أي حصص لهذا الطالب حتى الآن</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-16 animate-in slide-in-from-bottom duration-700">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 shadow-inner group">
                       <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-4">كفاءة الحصص</p>
                       <div className="flex items-end gap-4">
                          <h4 className="text-6xl font-black text-indigo-900">{selectedStudent.total_hours || 0}</h4>
                          <span className="text-lg font-black text-indigo-400 mb-2">ساعة تدريبية</span>
                       </div>
                       <div className="mt-8 flex items-center gap-3 text-emerald-600">
                          <TrendingUp size={18}/>
                          <span className="text-xs font-black">نمو مستمر في الأداء</span>
                       </div>
                    </div>
                    <div className="bg-amber-50 p-10 rounded-[3.5rem] border border-amber-100 shadow-inner group">
                       <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-4">معدل الانضباط المالي</p>
                       <div className="flex items-end gap-4">
                          <h4 className="text-6xl font-black text-amber-900">{Math.round(((selectedStudent.total_paid || 0) / (selectedStudent.agreed_amount || 1)) * 100)}%</h4>
                          <span className="text-lg font-black text-amber-500 mb-2">سداد فعلي</span>
                       </div>
                       <div className="mt-8 flex items-center gap-3 text-amber-600">
                          <DollarSign size={18}/>
                          <span className="text-xs font-black">تتبع المدفوعات المستلمة</span>
                       </div>
                    </div>
                    <div className="bg-emerald-50 p-10 rounded-[3.5rem] border border-emerald-100 shadow-inner group">
                       <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-4">متوسط مدة الحصة</p>
                       <div className="flex items-end gap-4">
                          <h4 className="text-6xl font-black text-emerald-900">{((selectedStudent.total_hours || 0) / (selectedStudent.total_lessons || 1)).toFixed(1)}</h4>
                          <span className="text-lg font-black text-emerald-500 mb-2">ساعة / حصة</span>
                       </div>
                       <div className="mt-8 flex items-center gap-3 text-emerald-600">
                          <Activity size={18}/>
                          <span className="text-xs font-black">استقرار الجدول الزمني</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-12 lg:p-16 rounded-[4.5rem] border border-slate-100">
                    <h3 className="text-3xl font-black text-slate-900 mb-14 flex items-center gap-5"><TrendingUp size={32} className="text-indigo-600"/> منحنى النشاط التدريسي (آخر 7 حصص)</h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 900}} dy={20} />
                          <YAxis hide />
                          <Tooltip contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                          <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={8} fillOpacity={1} fill="url(#colorHours)" dot={{r: 10, fill: '#fff', strokeWidth: 6, stroke: '#4f46e5'}} activeDot={{ r: 12, fill: '#4f46e5', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
                 <h3 className="text-4xl font-black text-slate-900 flex items-center gap-4"><Target size={36} className="text-indigo-600"/> المتابعة والتقدم الأكاديمي</h3>
                 {/* سيتم جلب وعرض التقارير الأكاديمية هنا */}
                 <div className="text-center py-20 opacity-20 italic">يتم تطوير نظام المتابعة المتقدم...</div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
                 <h3 className="text-4xl font-black text-slate-900 flex items-center gap-4"><Wallet size={36} className="text-emerald-600"/> السجل المالي والتحصيل</h3>
                 {/* سيتم جلب وعرض المدفوعات هنا */}
                 <div className="text-center py-20 opacity-20 italic">يتم تطوير نظام المالية المتقدم...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LESSON MODAL (Add/Edit) */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[600] flex items-center justify-center p-6 text-right">
          <form onSubmit={handleSaveLesson} className="bg-white w-full max-w-xl p-12 lg:p-16 rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[95vh] overflow-y-auto no-scrollbar border border-white/20">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="absolute top-12 left-12 text-slate-300 hover:text-rose-500 transition-all hover:rotate-90 duration-500"><X size={44}/></button>
            <h2 className="text-4xl font-black mb-14 text-slate-900 flex items-center gap-6">
              <div className="bg-indigo-600 p-5 rounded-[2.2rem] text-white shadow-2xl">{isEditMode ? <Edit3 size={32}/> : <Plus size={32}/>}</div>
              {isEditMode ? 'تعديل بيانات الحصة' : 'تسجيل حصة منجزة'}
            </h2>
            
            <div className="space-y-10">
               <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-[0.3em]">تاريخ التنفيذ</label>
                  <input required type="date" className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
               </div>
               <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-[0.3em]">عدد الساعات التدريسية</label>
                  <input required type="number" step="0.5" className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-4xl text-center text-indigo-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
               </div>
               <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-[0.3em]">ملاحظات الحصة</label>
                  <textarea placeholder="ماذا تم إنجازه اليوم؟" className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] h-40 font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
               </div>
               
               <button disabled={isSubmitting} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[3rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-6 active:scale-95 text-2xl group">
                 {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={32} className="group-hover:scale-110 transition-transform" />}
                 {isEditMode ? 'حفظ التعديلات' : 'تأكيد تسجيل الحصة'}
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
