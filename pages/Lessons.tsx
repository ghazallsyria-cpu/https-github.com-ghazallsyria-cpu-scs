
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { 
  Calendar, Clock, BookOpen, Search, Trash2, User, CheckCircle, AlertCircle, Edit3, X, Folder, ChevronLeft, Plus, Info, 
  Wallet, DollarSign, History, MoreHorizontal, ArrowDownRight, UserCircle 
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'payments'>('lessons');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<any>(null); // للدروس أو المدفوعات
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [lessonForm, setLessonForm] = useState({
    lesson_date: new Date().toISOString().split('T')[0],
    hours: '1',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view')
        .select('*')
        .eq('academic_year', year)
        .eq('semester', semester);
      
      if (!isAdmin) query = query.eq('teacher_id', uid);
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);
      
      // إذا كان هناك طالب مختار، نقوم بتحديث بياناته في السجل أيضاً لضمان دقة الإحصائيات
      if (selectedStudent) {
        const updated = (data || []).find(s => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    } catch (e: any) {
      showFeedback("خطأ في جلب الطلاب", "error");
    } finally {
      setLoading(false);
    }
  }, [uid, isAdmin, year, semester, selectedStudent?.id]);

  const fetchStudentRecords = async (studentId: string) => {
    setLoading(true);
    try {
      const [lessonsRes, paymentsRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('student_id', studentId).order('lesson_date', { ascending: false }),
        supabase.from('payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false })
      ]);
      
      if (lessonsRes.error) throw lessonsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setStudentLessons(lessonsRes.data || []);
      setStudentPayments(paymentsRes.data || []);
    } catch (e) {
      showFeedback("خطأ في جلب السجلات", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentRecords(selectedStudent.id);
    }
  }, [selectedStudent?.id]);

  const gradeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    students.forEach(s => {
      const g = s.grade || 'غير محدد';
      groups[g] = (groups[g] || 0) + 1;
    });
    return Object.entries(groups).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedGrade) list = list.filter(s => s.grade === selectedGrade);
    if (searchTerm) list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [students, selectedGrade, searchTerm]);

  // إدارة الدروس
  const handleLessonAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: selectedStudent.id,
        teacher_id: selectedStudent.teacher_id,
        lesson_date: lessonForm.lesson_date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      };

      let error;
      if (isEditModalOpen && targetItem) {
        const res = await supabase.from('lessons').update(payload).eq('id', targetItem.id);
        error = res.error;
      } else {
        const res = await supabase.from('lessons').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      showFeedback(isEditModalOpen ? "تم التحديث بنجاح" : "تمت الإضافة بنجاح");
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchStudents(); // لتحديث إحصائيات الطالب المختار
      fetchStudentRecords(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // إدارة المدفوعات
  const handlePaymentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: selectedStudent.id,
        teacher_id: selectedStudent.teacher_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes
      };

      let error;
      if (isEditModalOpen && targetItem) {
        const res = await supabase.from('payments').update(payload).eq('id', targetItem.id);
        error = res.error;
      } else {
        const res = await supabase.from('payments').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      showFeedback(isEditModalOpen ? "تم التحديث بنجاح" : "تم تسجيل الدفعة بنجاح");
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchStudents();
      fetchStudentRecords(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDelete = async (id: string, type: 'lesson' | 'payment') => {
    if (!confirm(`هل أنت متأكد من حذف هذا السجل من ${type === 'lesson' ? 'سجل الدروس' : 'سجل المدفوعات'}؟`)) return;
    try {
      const { error } = await supabase.from(type === 'lesson' ? 'lessons' : 'payments').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم الحذف بنجاح");
      fetchStudents();
      fetchStudentRecords(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const openEdit = (item: any) => {
    setTargetItem(item);
    if (activeTab === 'lessons') {
      setLessonForm({ lesson_date: item.lesson_date, hours: item.hours.toString(), notes: item.notes || '' });
    } else {
      setPaymentForm({ amount: item.amount.toString(), payment_date: item.payment_date, notes: item.notes || '' });
    }
    setIsEditModalOpen(true);
  };

  const openAdd = () => {
    if (activeTab === 'lessons') {
      setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '1', notes: '' });
    } else {
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
    }
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-right">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
            <Folder size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">مركز الطلاب</h1>
              {selectedGrade && (
                <div className="flex items-center gap-2">
                   <ChevronLeft size={16} className="text-slate-300" />
                   <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black">{selectedGrade}</span>
                </div>
              )}
              {selectedStudent && (
                <div className="flex items-center gap-2">
                   <ChevronLeft size={16} className="text-slate-300" />
                   <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">{selectedStudent.name}</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">إدارة شاملة للمجلدات الطلابية</p>
          </div>
        </div>

        {!selectedStudent && (
          <div className="relative w-full md:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="بحث فوري..." 
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-right"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 1. Grade View (Folders) */}
      {!selectedGrade && !selectedStudent && !searchTerm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-500">
          {gradeGroups.map(([grade, count]) => (
            <div 
              key={grade} 
              onClick={() => setSelectedGrade(grade)}
              className="bg-white p-8 rounded-[3rem] border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div className="bg-amber-50 text-amber-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <Folder size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">{grade}</h3>
              <p className="text-xs font-black text-slate-400 uppercase">{count} طالب مسجل</p>
            </div>
          ))}
          {gradeGroups.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center text-slate-300">
               <Info size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-black text-lg">لا يوجد بيانات لعرضها حالياً.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Students List View */}
      {selectedGrade && !selectedStudent && (
        <div className="space-y-4 animate-in fade-in duration-500">
           <button onClick={() => setSelectedGrade(null)} className="text-indigo-600 font-black text-xs flex items-center gap-1 hover:underline mb-4">
             <ChevronLeft size={14} className="rotate-180" /> العودة للصفوف الدراسية
           </button>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-600 shadow-sm transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{s.total_lessons} حصة | المتبقي: ${s.remaining_balance}</p>
                    </div>
                  </div>
                  <ChevronLeft size={18} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 3. Student Hub (Full Control) */}
      {selectedStudent && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <button onClick={() => { setSelectedStudent(null); setActiveTab('lessons'); }} className="text-indigo-600 font-black text-xs flex items-center gap-1 hover:underline">
               <ChevronLeft size={14} className="rotate-180" /> العودة لقائمة الطلاب
            </button>
            <div className="flex gap-2">
               <button onClick={openAdd} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                 <Plus size={16}/> {activeTab === 'lessons' ? 'إضافة حصة' : 'تسجيل دفعة'}
               </button>
            </div>
          </div>

          {/* Student Profile Summary Card */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                   <div className="bg-white/10 p-5 rounded-[2rem] border border-white/10">
                      <UserCircle size={56} className="text-indigo-400" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black">{selectedStudent.name}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black">{selectedStudent.grade}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest">{selectedStudent.is_hourly ? 'نظام الساعات' : 'نظام فصلي'}</span>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full md:w-auto text-center">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">الدروس</p>
                      <p className="text-xl font-black">{selectedStudent.total_lessons}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">الساعات</p>
                      <p className="text-xl font-black">{selectedStudent.total_hours}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">المسدد</p>
                      <p className="text-xl font-black text-emerald-400">${selectedStudent.total_paid}</p>
                   </div>
                   <div className={`p-4 rounded-2xl border ${selectedStudent.remaining_balance > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">المتبقي</p>
                      <p className={`text-xl font-black ${selectedStudent.remaining_balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${selectedStudent.remaining_balance}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Management Tabs */}
          <div className="bg-white p-2 rounded-[2rem] border border-slate-200 flex w-full max-w-sm mx-auto shadow-sm">
             <button 
                onClick={() => setActiveTab('lessons')} 
                className={`flex-1 py-3 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'lessons' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
             >
                <BookOpen size={18}/> الدروس
             </button>
             <button 
                onClick={() => setActiveTab('payments')} 
                className={`flex-1 py-3 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
             >
                <Wallet size={18}/> المالية
             </button>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm animate-in slide-in-from-top duration-300">
            {activeTab === 'lessons' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                      <th className="p-6">تاريخ الحصة</th>
                      <th className="p-6">المدة</th>
                      <th className="p-6">الملاحظات</th>
                      <th className="p-6 text-center">إدارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentLessons.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6 font-bold text-slate-700">
                          <div className="flex items-center gap-3">
                             <Calendar size={14} className="text-indigo-400" />
                             {new Date(l.lesson_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-black">{l.hours} ساعة</span>
                        </td>
                        <td className="p-6 text-sm text-slate-500 font-medium italic">{l.notes || '-'}</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-3">
                             <button onClick={() => openEdit(l)} className="text-emerald-500 hover:text-emerald-700"><Edit3 size={18}/></button>
                             <button onClick={() => handleDelete(l.id, 'lesson')} className="text-rose-400 hover:text-rose-600"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {studentLessons.length === 0 && (
                      <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic">لا يوجد حصص مسجلة.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                      <th className="p-6">تاريخ الدفعة</th>
                      <th className="p-6">المبلغ</th>
                      <th className="p-6">الملاحظات</th>
                      <th className="p-6 text-center">إدارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 font-bold text-slate-700">
                          <div className="flex items-center gap-3">
                             <History size={14} className="text-emerald-400" />
                             {new Date(p.payment_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 font-black text-emerald-600">
                            <ArrowDownRight size={14}/>
                            ${p.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="p-6 text-sm text-slate-500 font-medium italic">{p.notes || '-'}</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-3">
                             <button onClick={() => openEdit(p)} className="text-emerald-500 hover:text-emerald-700"><Edit3 size={18}/></button>
                             <button onClick={() => handleDelete(p.id, 'payment')} className="text-rose-400 hover:text-rose-600"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {studentPayments.length === 0 && (
                      <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic">لا يوجد دفعات مسجلة.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Modal (Add/Edit) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <form 
            onSubmit={activeTab === 'lessons' ? handleLessonAction : handlePaymentAction} 
            className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 border border-slate-100 text-right"
          >
            <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">
              {isEditModalOpen ? (activeTab === 'lessons' ? 'تعديل الحصة' : 'تعديل الدفعة') : (activeTab === 'lessons' ? 'تسجيل حصة جديدة' : 'تسجيل دفعة نقدية')}
            </h2>
            <div className="space-y-5">
              {activeTab === 'lessons' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تاريخ الحصة</label>
                    <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">عدد الساعات</label>
                    <input required type="number" step="0.5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">ملاحظات</label>
                    <textarea placeholder="تفاصيل الدرس.." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-24" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">المبلغ المستلم ($)</label>
                    <div className="relative">
                       <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                       <input required type="number" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تاريخ الاستلام</label>
                    <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">ملاحظات</label>
                    <textarea placeholder="دفعة شهر.." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-24" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
                  </div>
                </>
              )}
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                {isEditModalOpen ? 'حفظ التعديلات' : 'تأكيد العملية'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
