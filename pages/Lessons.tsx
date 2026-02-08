
import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useLocation } = ReactRouterDOM as any;
import { supabase } from '../supabase';
import { 
  BookOpen, Plus, Clock, RefreshCw, Save, Edit3, Trash2, CheckCircle, AlertCircle, ChevronLeft, X, AlertTriangle, Users, Search
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester, isAdmin }: { role: any, uid: any, year: string, semester: string, isAdmin?: boolean }) => {
  const location = useLocation();
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(location.state?.studentToOpen || null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '2', notes: '' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // قمنا بإزالة الفلترة الصارمة على semester/year لضمان رؤية كافة الطلاب إذا لم تكن موجودة
      let query = supabase.from('student_summary_view').select('*');
      if (role !== 'admin') {
        query = query.eq('teacher_id', uid);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, role]);

  const fetchRecords = async (sid: string) => {
    setLoading(true);
    try {
      const { data } = await supabase.from('lessons').select('*').eq('student_id', sid).order('lesson_date', { ascending: false });
      setStudentLessons(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { if (selectedStudent) fetchRecords(selectedStudent.id); }, [selectedStudent]);

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('lessons').insert([{
        student_id: selectedStudent.id,
        teacher_id: uid,
        lesson_date: form.lesson_date,
        hours: parseFloat(form.hours),
        notes: form.notes
      }]);
      setIsLessonModalOpen(false); 
      fetchRecords(selectedStudent.id);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => s.name.includes(searchTerm));

  return (
    <div className="space-y-10 pb-32">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><BookOpen size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">سجل <span className="text-indigo-600">الحصص</span></h2>
            <p className="text-slate-400 font-bold">{selectedStudent ? `إدارة حصص: ${selectedStudent.name}` : 'اختر طالباً لتسجيل حصصه.'}</p>
          </div>
        </div>
        {!selectedStudent && (
          <div className="relative w-full md:w-64">
             <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
             <input placeholder="بحث باسم الطالب..." className="w-full pr-12 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-2 ring-indigo-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        )}
      </div>

      {!selectedStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredStudents.map(s => (
             <button key={s.id} onClick={() => setSelectedStudent(s)} className="p-10 bg-white rounded-[4rem] border hover:shadow-xl transition-all group text-right relative overflow-hidden">
                <h3 className="text-2xl font-black group-hover:text-indigo-600">{s.name}</h3>
                <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold text-sm">
                   الصف {s.grade} | <Clock size={14} className="text-indigo-600" /> {s.total_lessons} حصة
                </div>
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-100 group-hover:text-indigo-600 transition-all">
                   <ChevronLeft size={48} className="rotate-180" />
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left-8">
           <div className="flex justify-between items-center">
              <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-slate-400 font-black hover:text-indigo-600">
                <ChevronLeft className="rotate-180" size={20} /> تراجع
              </button>
              <button onClick={() => setIsLessonModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3">
                <Plus size={20} /> إضافة حصة
              </button>
           </div>
           <div className="grid grid-cols-1 gap-6">
              {studentLessons.map(l => (
                <div key={l.id} className="p-8 bg-white rounded-[2.5rem] border shadow-sm flex justify-between items-center">
                   <div className="flex items-center gap-6">
                      <div className="bg-slate-50 p-5 rounded-3xl text-indigo-600 font-black min-w-[120px] text-center">
                         <span className="block text-[10px] text-slate-400 uppercase">التاريخ</span>
                         <span className="text-sm">{l.lesson_date}</span>
                      </div>
                      <div className="text-right">
                         <h4 className="font-black text-xl text-slate-900">{l.hours} ساعة دراسية</h4>
                         <p className="text-slate-400 font-bold mt-1 text-sm">{l.notes || '---'}</p>
                      </div>
                   </div>
                   <button onClick={() => setConfirmDeleteId(l.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                </div>
              ))}
           </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl text-right">
           <form onSubmit={handleSaveLesson} className="bg-white w-full max-w-md p-12 rounded-[3.5rem] space-y-8 animate-in zoom-in">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black">حصة جديدة</h2>
                 <button type="button" onClick={() => setIsLessonModalOpen(false)} className="p-3 bg-slate-50 rounded-full"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2"><label className="text-sm font-black">التاريخ</label><input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.lesson_date} onChange={e => setForm({...form, lesson_date: e.target.value})} /></div>
                 <div className="space-y-2"><label className="text-sm font-black">عدد الساعات</label><input type="number" step="0.5" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} /></div>
                 <div className="space-y-2"><label className="text-sm font-black">ملاحظات</label><textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-32" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl"><Save size={24} className="inline ml-2" /> حفظ الحصة</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
