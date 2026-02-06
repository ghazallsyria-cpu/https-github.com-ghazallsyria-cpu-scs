
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  BookOpen, Plus, Clock, RefreshCw, Save, Edit3, Trash2, CheckCircle, AlertCircle, ChevronLeft, X, AlertTriangle
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const location = useLocation();
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(location.state?.studentToOpen || null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '2', notes: '' });

  const fetchStudents = useCallback(async () => {
    let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
    if (role !== 'admin') query = query.eq('teacher_id', uid);
    const { data } = await query.order('name');
    setStudents(data || []);
  }, [uid, role, year, semester]);

  const fetchRecords = async (sid: string) => {
    setLoading(true);
    const { data } = await supabase.from('lessons').select('*').eq('student_id', sid).order('lesson_date', { ascending: false });
    setStudentLessons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { if (selectedStudent) fetchRecords(selectedStudent.id); }, [selectedStudent]);

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('lessons').insert([{
      student_id: selectedStudent.id,
      teacher_id: uid,
      lesson_date: form.lesson_date,
      hours: parseFloat(form.hours),
      notes: form.notes
    }]);
    setIsLessonModalOpen(false); fetchRecords(selectedStudent.id);
  };

  const handleDeleteLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id);
    setConfirmDeleteId(null);
    fetchRecords(selectedStudent.id);
    fetchStudents(); // Refresh general count
  };

  return (
    <div className="space-y-10 pb-32">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><BookOpen size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">سجل <span className="text-indigo-600">الحصص</span></h2>
            <p className="text-slate-400 font-bold">{selectedStudent ? `إدارة حصص الطالب: ${selectedStudent.name}` : 'اختر طالباً لإدارة سجلاته الدراسية'}</p>
          </div>
        </div>
      </div>

      {!selectedStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {students.map(s => (
             <button key={s.id} onClick={() => setSelectedStudent(s)} className="p-10 bg-white rounded-[4rem] border hover:shadow-xl hover:border-indigo-100 transition-all group text-right relative">
                <h3 className="text-2xl font-black group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                <div className="flex items-center gap-2 mt-4 text-indigo-600 font-black text-sm bg-indigo-50 w-fit px-4 py-2 rounded-full">
                   <Clock size={16} /> {s.total_lessons} حصة منجزة
                </div>
                <ChevronLeft className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-indigo-600 group-hover:-translate-x-2 transition-all" size={32} />
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-500">
           <div className="flex justify-between items-center">
              <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-slate-400 font-black hover:text-indigo-600 transition-all">
                <ChevronLeft className="rotate-180" size={20} /> العودة لقائمة الطلاب
              </button>
              <button onClick={() => setIsLessonModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100">
                <Plus size={22} /> إضافة حصة جديدة
              </button>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {studentLessons.length > 0 ? studentLessons.map(l => (
                <div key={l.id} className="p-8 bg-white rounded-[2.5rem] border hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-6 w-full">
                      <div className="bg-slate-50 p-5 rounded-3xl text-indigo-600 font-black text-center min-w-[100px]">
                         <span className="block text-[10px] text-slate-400 uppercase">التاريخ</span>
                         {l.lesson_date}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-4">
                            <h4 className="font-black text-xl text-slate-900">{l.hours} ساعة دراسية</h4>
                         </div>
                         <p className="text-slate-400 font-bold mt-1">{l.notes || 'لا توجد ملاحظات لهذه الحصة'}</p>
                      </div>
                   </div>
                   <button onClick={() => setConfirmDeleteId(l.id)} className="p-5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                      <Trash2 size={20} />
                   </button>
                </div>
              )) : (
                <div className="py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                   <Clock size={48} className="mx-auto text-slate-100 mb-6" />
                   <p className="text-slate-400 font-black text-xl">لا توجد حصص مسجلة بعد لهذا الطالب.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Confirmation Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto">
                 <AlertTriangle size={40} />
              </div>
              <div className="text-center">
                 <h3 className="text-2xl font-black mb-2">تأكيد حذف الحصة؟</h3>
                 <p className="text-slate-500 font-bold">هذا الإجراء سيؤدي لحذف سجل الحصة نهائياً من قاعدة البيانات.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">تراجع</button>
                 <button onClick={() => handleDeleteLesson(confirmDeleteId)} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg">حذف نهائي</button>
              </div>
           </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <form onSubmit={handleSaveLesson} className="bg-white w-full max-w-md p-12 rounded-[3.5rem] space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black">تسجيل حصة جديدة</h2>
                 <button type="button" onClick={() => setIsLessonModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2"><label className="text-sm font-black">تاريخ الحصة</label><input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={form.lesson_date} onChange={e => setForm({...form, lesson_date: e.target.value})} /></div>
                 <div className="space-y-2"><label className="text-sm font-black">عدد الساعات</label><input type="number" step="0.5" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="مثال: 2" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} /></div>
                 <div className="space-y-2"><label className="text-sm font-black">ملاحظات إضافية</label><textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-32 outline-none" placeholder="موضوع الحصة..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">حفظ البيانات</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
