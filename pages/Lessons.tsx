
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useLocation } = ReactRouterDOM as any;
import { supabase } from '../supabase';
import { 
  BookOpen, Plus, Clock, RefreshCw, Save, Edit3, Trash2, CheckCircle, AlertCircle, 
  ChevronLeft, X, AlertTriangle, Users, Search, Folder, ChevronDown
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester, isAdmin }: { role: any, uid: any, year: string, semester: string, isAdmin?: boolean }) => {
  const location = useLocation();
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState(location.state?.studentToOpen || null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [form, setForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '2', notes: '' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*');
      if (role !== 'admin') {
        query = query.eq('teacher_id', uid);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;

      const filtered = (data || []).filter(s => 
        (s.academic_year === year && s.semester === semester) || (!s.academic_year)
      );

      setStudents(filtered);
      
      // توسيع كافة المجلدات تلقائياً عند وجود نتائج بحث
      if (searchTerm) {
        // Fix: Explicitly type the grades array as string[] to avoid 'unknown[]' type error
        const grades: string[] = Array.from(new Set(filtered.map((s: any) => String(s.grade))));
        setExpandedGrades(grades);
      }
    } catch (err) {
      console.error("Fetch Students Error:", err);
    } finally {
      setLoading(false);
    }
  }, [uid, role, year, semester, searchTerm]);

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

  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

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

  // تجميع الطلاب حسب الصف الدراسي
  const groupedByGrade = useMemo(() => {
    const filtered = students.filter(s => s.name.includes(searchTerm));
    return filtered.reduce((acc, s) => {
      const grade = String(s.grade || 'غير محدد');
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(s);
      return acc;
    }, {} as any);
  }, [students, searchTerm]);

  const sortedGrades = useMemo(() => {
    return Object.keys(groupedByGrade).sort((a, b) => {
      if (isNaN(Number(a)) || isNaN(Number(b))) return a.localeCompare(b);
      return Number(b) - Number(a);
    });
  }, [groupedByGrade]);

  return (
    <div className="space-y-10 pb-32">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><BookOpen size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">سجل <span className="text-indigo-600">الحصص</span></h2>
            <p className="text-slate-400 font-bold">
              {selectedStudent ? `إدارة حصص: ${selectedStudent.name}` : `قائمة طلاب فترة: ${year}`}
            </p>
          </div>
        </div>
        {!selectedStudent && (
          <div className="relative w-full md:w-80">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
             <input placeholder="البحث عن طالب..." className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        )}
      </div>

      {!selectedStudent ? (
        <div className="space-y-6 animate-in fade-in duration-500">
           {loading ? (
             <div className="py-24 text-center">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="font-black text-slate-400 text-sm tracking-widest uppercase">جاري فرز المجلدات الدراسية...</p>
             </div>
           ) : sortedGrades.length > 0 ? sortedGrades.map(grade => (
             <div key={grade} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleGrade(grade)}
                  className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                      <Folder size={24} fill="currentColor" />
                    </div>
                    <div className="text-right">
                       <h3 className="text-xl font-black text-slate-900">طلاب الصف {grade}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">إجمالي المجلد: {groupedByGrade[grade].length} طلاب</p>
                    </div>
                  </div>
                  <ChevronDown className={`text-slate-300 transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={28} />
                </button>

                {expandedGrades.includes(grade) && (
                  <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                    {groupedByGrade[grade].map((s: any) => (
                      <button 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)} 
                        className="p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all group text-right relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                              {s.name[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Clock size={12} /> {s.total_lessons} حصة منجزة</p>
                           </div>
                        </div>
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-100 opacity-0 group-hover:opacity-100 transition-all">
                           <ChevronLeft size={32} className="rotate-180" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
             </div>
           )) : (
             <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                <Users size={64} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-black text-xl">لا توجد سجلات مطابقة في هذه الفترة.</p>
                <button onClick={() => setSearchTerm('')} className="mt-6 text-indigo-600 font-black text-sm hover:underline">إعادة عرض كافة المجلدات</button>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left-8">
           <div className="flex justify-between items-center">
              <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-slate-400 font-black hover:text-indigo-600 transition-all group">
                <ChevronLeft className="rotate-180 group-hover:-translate-x-1 transition-transform" size={20} /> تراجع للمجلدات
              </button>
              <button onClick={() => setIsLessonModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                <Plus size={20} /> تسجيل حصة جديدة
              </button>
           </div>
           
           <div className="bg-indigo-600 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl shadow-indigo-100">
              <div>
                 <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">الطالب الحالي</p>
                 <h4 className="text-3xl font-black">{selectedStudent.name}</h4>
                 <p className="text-xs font-bold text-indigo-200 mt-1">الصف {selectedStudent.grade} | {selectedStudent.group_name || 'طلاب فردي'}</p>
              </div>
              <div className="text-center bg-white/10 px-8 py-4 rounded-3xl border border-white/10">
                 <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">إجمالي الحصص</p>
                 <p className="text-2xl font-black">{studentLessons.length}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {studentLessons.length > 0 ? studentLessons.map(l => (
                <div key={l.id} className="p-8 bg-white rounded-[2.5rem] border shadow-sm flex justify-between items-center group hover:border-indigo-100 transition-all">
                   <div className="flex items-center gap-6">
                      <div className="bg-slate-50 p-5 rounded-3xl text-indigo-600 font-black min-w-[120px] text-center shadow-inner group-hover:bg-indigo-50 transition-colors">
                         <span className="block text-[10px] text-slate-400 uppercase mb-1">التاريخ</span>
                         <span className="text-sm">{l.lesson_date}</span>
                      </div>
                      <div className="text-right">
                         <h4 className="font-black text-xl text-slate-900">{l.hours} ساعة دراسية</h4>
                         <p className="text-slate-400 font-bold mt-1 text-sm">{l.notes || 'لم يتم إضافة ملاحظات لهذه الحصة.'}</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => {
                      if(confirm("هل أنت متأكد من حذف سجل هذه الحصة؟")) {
                        supabase.from('lessons').delete().eq('id', l.id).then(() => fetchRecords(selectedStudent.id));
                      }
                    }} 
                    className="p-4 bg-rose-50 text-rose-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                   >
                    <Trash2 size={20} />
                   </button>
                </div>
              )) : (
                <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-50 shadow-sm">
                   <AlertCircle size={40} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-slate-400 font-black">لا يوجد حصص مسجلة لهذا الطالب في السجل.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl text-right">
           <form onSubmit={handleSaveLesson} className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                 <h2 className="text-2xl font-black text-slate-900">تسجيل حصة جديدة</h2>
                 <button type="button" onClick={() => setIsLessonModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">تاريخ الحصة</label>
                    <input type="date" className="w-full p-6 bg-slate-50 rounded-2xl font-bold border-none shadow-inner focus:ring-4 ring-indigo-50 outline-none transition-all" value={form.lesson_date} onChange={e => setForm({...form, lesson_date: e.target.value})} />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">عدد الساعات</label>
                    <input type="number" step="0.5" className="w-full p-6 bg-slate-50 rounded-2xl font-bold border-none shadow-inner focus:ring-4 ring-indigo-50 outline-none transition-all text-center text-2xl" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">ملاحظات الدرس</label>
                    <textarea placeholder="ماذا تم شرحه اليوم؟" className="w-full p-6 bg-slate-50 rounded-2xl font-bold h-32 border-none shadow-inner focus:ring-4 ring-indigo-50 outline-none transition-all" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black">إلغاء</button>
                 <button type="submit" disabled={loading} className="flex-[2] py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                   {loading ? <RefreshCw className="animate-spin" /> : <Save size={24} />} حفظ الحصة
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
