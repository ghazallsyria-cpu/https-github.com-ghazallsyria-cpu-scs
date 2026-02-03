import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { StudentStats } from '../types.ts';
import { Plus, MapPin, Phone, Calendar, Search } from 'lucide-react';

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
    try {
      let qSt = supabase.from('students').select('*');
      let qLe = supabase.from('lessons').select('*');

      if (role === 'teacher') {
        qSt = qSt.eq('teacher_id', uid);
        qLe = qLe.eq('teacher_id', uid);
      }

      const [{ data: stds }, { data: lsns }] = await Promise.all([qSt, qLe]);
      
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة الطلاب</h1>
          <p className="text-slate-500 font-bold">قائمة الطلاب المسجلين وتقدمهم.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2"
        >
          <Plus size={20} /> طالب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(s => (
          <div key={s.id} className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm relative group">
            <button 
              onClick={() => { setSelectedStudent(s); setIsLessonModalOpen(true); }}
              className="absolute top-6 left-6 p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"
            ><Calendar size={18}/></button>
            <h3 className="text-xl font-black text-slate-900 mb-1">{s.name}</h3>
            <p className="text-slate-400 font-bold text-xs mb-4">{s.grade}</p>
            <div className="space-y-2 text-sm text-slate-500 font-bold">
              <div className="flex items-center gap-2"><MapPin size={14}/> {s.address}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {s.phone}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-5 mt-5 border-t border-slate-50">
               <div className="text-center">
                 <p className="text-[10px] text-slate-400 font-black">حصص</p>
                 <p className="font-black text-slate-900">{s.total_lessons}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-slate-400 font-black">ساعة</p>
                 <p className="font-black text-slate-900">{s.total_hours}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-indigo-400 font-black">اتفاق</p>
                 <p className="font-black text-indigo-700">${s.agreed_amount}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-md p-8 rounded-[2.5rem] space-y-4">
            <h2 className="text-2xl font-black text-slate-900">إضافة طالب</h2>
            <input required placeholder="الاسم" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input required placeholder="العنوان" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            <input required placeholder="الهاتف" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <input required placeholder="الصف" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
            <input required type="number" placeholder="المبلغ ($)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
            <div className="pt-2">
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg">حفظ</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-400 font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;