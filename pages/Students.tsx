import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { StudentStats } from '../types.ts';
import { Plus, MapPin, Phone, Calendar, X } from 'lucide-react';

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
        total_paid: 0,
        remaining_balance: 0
      };
    });
    setStudents(enriched);
    setLoading(false);
  }, [uid, role]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('students').insert([{ ...form, agreed_amount: parseFloat(form.agreed_amount), teacher_id: uid }]);
    setIsModalOpen(false);
    setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
    fetchStudents();
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    await supabase.from('lessons').insert([{
      student_id: selectedStudent.id,
      teacher_id: uid,
      lesson_date: lessonForm.lesson_date,
      hours: parseFloat(lessonForm.hours),
      notes: lessonForm.notes
    }]);
    setIsLessonModalOpen(false);
    setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '1', notes: '' });
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">الطلاب</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2">
          <Plus size={20} /> طالب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <button 
              onClick={() => { setSelectedStudent(s); setIsLessonModalOpen(true); }}
              className="absolute top-6 left-6 p-2 bg-indigo-50 text-indigo-600 rounded-lg"
            ><Calendar size={18}/></button>
            <h3 className="text-xl font-black text-slate-900 mb-1">{s.name}</h3>
            <p className="text-indigo-600 font-bold mb-4">{s.grade}</p>
            <div className="space-y-2 text-sm text-slate-500 font-bold">
              <div className="flex items-center gap-2"><MapPin size={14}/> {s.address}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {s.phone}</div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between">
               <div className="text-center">
                 <p className="text-[10px] text-slate-400">حصص</p>
                 <p className="font-black">{s.total_lessons}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-slate-400">ساعات</p>
                 <p className="font-black">{s.total_hours}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-slate-400">اتفاق</p>
                 <p className="font-black text-indigo-600">${s.agreed_amount}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-md p-8 rounded-3xl space-y-4">
            <h2 className="text-2xl font-black mb-6">إضافة طالب</h2>
            <input required placeholder="الاسم" className="w-full p-3 border rounded-xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input required placeholder="الصف" className="w-full p-3 border rounded-xl" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
            <input required type="number" placeholder="المبلغ ($)" className="w-full p-3 border rounded-xl" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">حفظ</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-500">إلغاء</button>
          </form>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddLesson} className="bg-white w-full max-w-md p-8 rounded-3xl space-y-4">
            <h2 className="text-2xl font-black">تسجيل حصة</h2>
            <p className="text-indigo-600 font-bold">{selectedStudent?.name}</p>
            <input required type="date" className="w-full p-3 border rounded-xl" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
            <input required type="number" step="0.5" placeholder="عدد الساعات" className="w-full p-3 border rounded-xl" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">تسجيل</button>
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="w-full py-3 text-slate-500">إلغاء</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;