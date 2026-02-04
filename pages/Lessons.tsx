
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { Calendar, Clock, BookOpen, Search, Trash2, User, CheckCircle, AlertCircle, Edit3, X, Folder, ChevronLeft, Plus, Info, MoreHorizontal } from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetLesson, setTargetLesson] = useState<any>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [lessonForm, setLessonForm] = useState({
    lesson_date: new Date().toISOString().split('T')[0],
    hours: '1',
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
    } catch (e: any) {
      showFeedback("خطأ في جلب الطلاب", "error");
    } finally {
      setLoading(false);
    }
  }, [uid, isAdmin, year, semester]);

  const fetchStudentLessons = async (studentId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false });
      
      if (error) throw error;
      setStudentLessons(data || []);
    } catch (e) {
      showFeedback("خطأ في جلب الدروس", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentLessons(selectedStudent.id);
    } else {
      setStudentLessons([]);
    }
  }, [selectedStudent]);

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

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('lessons').insert([{
        student_id: selectedStudent.id,
        teacher_id: selectedStudent.teacher_id,
        lesson_date: lessonForm.lesson_date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      }]);
      if (error) throw error;
      showFeedback("تمت إضافة الحصة بنجاح");
      setIsAddModalOpen(false);
      setLessonForm({ ...lessonForm, notes: '' });
      fetchStudentLessons(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLesson) return;
    try {
      const { error } = await supabase.from('lessons').update({
        lesson_date: lessonForm.lesson_date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      }).eq('id', targetLesson.id);
      if (error) throw error;
      showFeedback("تم تحديث الحصة");
      setIsEditModalOpen(false);
      fetchStudentLessons(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الحصة؟')) return;
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم الحذف بنجاح");
      fetchStudentLessons(selectedStudent.id);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const openEdit = (lesson: any) => {
    setTargetLesson(lesson);
    setLessonForm({
      lesson_date: lesson.lesson_date,
      hours: lesson.hours.toString(),
      notes: lesson.notes || ''
    });
    setIsEditModalOpen(true);
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
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">سجل الدروس</h1>
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
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">تتبع الحصص الدراسية حسب المجلدات</p>
          </div>
        </div>

        {!selectedStudent && (
          <div className="relative w-full md:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="بحث عن طالب..." 
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {selectedStudent && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 text-sm flex items-center gap-2"
          >
            <Plus size={18}/> إضافة حصة جديدة
          </button>
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
              <p className="text-xs font-black text-slate-400 uppercase">{count} طالب</p>
            </div>
          ))}
          {gradeGroups.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center text-slate-300">
               <Info size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-black text-lg">لا يوجد طلاب مسجلين.</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Students List View (Inside Grade) */}
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
                    <div className="bg-slate-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{s.total_lessons} حصة مسجلة</p>
                    </div>
                  </div>
                  <ChevronLeft size={18} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 3. Student Lessons View */}
      {selectedStudent && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <button onClick={() => setSelectedStudent(null)} className="text-indigo-600 font-black text-xs flex items-center gap-1 hover:underline">
             <ChevronLeft size={14} className="rotate-180" /> العودة لقائمة الطلاب
          </button>
          
          <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <th className="p-6">التاريخ</th>
                    <th className="p-6">الساعات</th>
                    <th className="p-6">الملاحظات</th>
                    <th className="p-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentLessons.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-indigo-500" />
                           {new Date(l.lesson_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-black">
                          {l.hours} ساعة
                        </span>
                      </td>
                      <td className="p-6 text-sm text-slate-500 font-medium italic">
                        {l.notes || '-'}
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                           <button onClick={() => openEdit(l)} className="text-emerald-500 hover:text-emerald-700 transition-colors"><Edit3 size={18}/></button>
                           <button onClick={() => handleDeleteLesson(l.id)} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {studentLessons.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center font-bold text-slate-400 italic">
                         لم يتم تسجيل حصص لهذا الطالب بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Lesson */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <form onSubmit={isEditModalOpen ? handleUpdateLesson : handleAddLesson} className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">{isEditModalOpen ? 'تعديل بيانات الحصة' : 'تسجيل حصة جديدة'}</h2>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تاريخ الحصة</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">عدد الساعات</label>
                <input required type="number" step="0.5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">ملاحظات الحصة</label>
                <textarea placeholder="مثال: مراجعة الوحدة الأولى.." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-32" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-700 transition-all">
                {isEditModalOpen ? 'تحديث البيانات' : 'تأكيد تسجيل الحصة'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
