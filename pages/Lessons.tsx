import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  BookOpen, Plus, Clock, RefreshCw, Save, Edit3, Trash2, CheckCircle, AlertCircle, ChevronLeft
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const location = useLocation();
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(location.state?.studentToOpen || null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
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

  return (
    <div className="space-y-10 pb-32">
      {!selectedStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {students.map(s => (
             <button key={s.id} onClick={() => setSelectedStudent(s)} className="p-10 bg-white rounded-[4rem] border hover:shadow-xl transition-all">
                <h3 className="text-2xl font-black">{s.name}</h3>
                <p className="text-sm font-black text-indigo-600 mt-2">الحصص المنجزة: {s.total_lessons}</p>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-10">
           <button onClick={() => setSelectedStudent(null)} className="text-indigo-600 font-black">العودة</button>
           <h2 className="text-4xl font-black">{selectedStudent.name}</h2>
           <button onClick={() => setIsLessonModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black">تسجيل حصة</button>
           <div className="space-y-6">
              {studentLessons.map(l => (
                <div key={l.id} className="p-8 bg-white rounded-[2rem] border flex justify-between items-center">
                   <div>
                      <p className="font-black">{l.lesson_date}</p>
                      <p className="text-xs text-slate-400">عدد الساعات: {l.hours}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleSaveLesson} className="bg-white p-10 rounded-[3rem] w-full max-w-md">
              <h2 className="text-2xl font-black mb-8">تسجيل حصة</h2>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl mb-4" value={form.lesson_date} onChange={e => setForm({...form, lesson_date: e.target.value})} />
              <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl mb-4" placeholder="ساعات" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">حفظ</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;