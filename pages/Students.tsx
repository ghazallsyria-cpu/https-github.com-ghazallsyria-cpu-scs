import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { StudentStats, Lesson } from '../types';
import { Plus, MapPin, Phone, Clock, Calendar, X, Info } from 'lucide-react';

const Students = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  
  const [form, setForm] = useState({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
  const [lessonForm, setLessonForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '1', notes: '' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let qStds = supabase.from('students').select('*');
    let qLsns = supabase.from('lessons').select('*');

    if (role === 'teacher') {
      qStds = qStds.eq('teacher_id', uid);
      qLsns = qLsns.eq('teacher_id', uid);
    }

    const [{ data: stds }, { data: lsns }] = await Promise.all([qStds, qLsns]);
    
    const enriched = (stds || []).map(s => {
      const sLsn = (lsns || []).filter(l => l.student_id === s.id);
      return {
        ...s,
        total_lessons: sLsn.length,
        total_hours: sLsn.reduce((acc, l) => acc + Number(l.hours), 0),
        total_paid: 0, // سيتم حسابها في صفحة المالية أو عبر استعلام إضافي هنا
        remaining_balance: 0
      };
    });
    setStudents(enriched);
    setLoading(false);
  }, [uid, role]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('students').insert([{ ...form, agreed_amount: parseFloat(form.agreed_amount), teacher_id: uid }]);
    if (error) alert("خطأ في الإضافة: " + error.message);
    else {
      setIsModalOpen(false);
      setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
      fetchStudents();
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const { error } = await supabase.from('lessons').insert([{
      student_id: selectedStudent.id,
      teacher_id: uid,
      lesson_date: lessonForm.lesson_date,
      hours: parseFloat(lessonForm.hours),
      notes: lessonForm.notes
    }]);

    if (error) alert("خطأ في تسجيل الحصة: " + error.message);
    else {
      setIsLessonModalOpen(false);
      setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '1', notes: '' });
      fetchStudents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900">قائمة الطلاب</h1>
          <p className="text-slate-500 font-bold mt-1">لديك حالياً {students.length} طلاب مسجلين.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
          <Plus size={20} /> إضافة طالب جديد
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 font-bold text-slate-400">جاري تحميل البيانات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(s => (
            <div key={s.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-black">{s.grade}</span>
                </div>
                <button 
                  onClick={() => { setSelectedStudent(s); setIsLessonModalOpen(true); }}
                  className="p-2 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                  title="تسجيل حصة جديدة"
                >
                  <Calendar size={20} />
                </button>
              </div>
              
              <div className="space-y-3 text-sm text-slate-500 font-bold mb-6">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-indigo-400"/> {s.address || 'لا يوجد عنوان'}</div>
                <div className="flex items-center gap-2"><Phone size={16} className="text-indigo-400"/> {s.phone || 'لا يوجد رقم'}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-100 mt-auto">
                 <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">الحصص</p>
                    <p className="font-black text-slate-900">{s.total_lessons}</p>
                 </div>
                 <div className="text-center border-x border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">الساعات</p>
                    <p className="font-black text-slate-900">{s.total_hours}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">الاتفاق</p>
                    <p className="font-black text-indigo-600">${s.agreed_amount}</p>
                 </div>
              </div>
            </div>
          ))}
          {students.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">لا يوجد طلاب حالياً، ابدأ بإضافة أول طالب.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Student */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">بيانات الطالب الجديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">الاسم بالكامل</label>
                <input required placeholder="مثال: محمد أحمد" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600 mr-2">الصف</label>
                  <input required placeholder="10 / ثانوي" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600 mr-2">مبلغ الاتفاق ($)</label>
                  <input required type="number" placeholder="500" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">رقم الهاتف</label>
                <input placeholder="05XXXXXXXX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">العنوان</label>
                <input placeholder="الحي، المدينة..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all">حفظ البيانات</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Lesson */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">تسجيل حصة</h2>
                <p className="text-indigo-600 font-bold text-sm">للطالب: {selectedStudent?.name}</p>
              </div>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddLesson} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600 mr-2">التاريخ</label>
                  <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600 mr-2">عدد الساعات</label>
                  <input required type="number" step="0.5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">ملاحظات (اختياري)</label>
                <textarea rows={3} placeholder="ماذا تم شرحه في هذه الحصة؟" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none resize-none" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all">تسجيل الحصة</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;