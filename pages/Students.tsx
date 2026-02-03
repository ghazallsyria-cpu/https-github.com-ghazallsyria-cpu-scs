
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Student, StudentStats } from '../types';
import { Plus, Search, MapPin, Phone, BookOpen, Clock, AlertCircle } from 'lucide-react';

// Fix: Ensure props are properly typed and data is filtered for privacy/security
const Students = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({ name: '', address: '', phone: '', grade: '', agreed_payment: '' });
  const [lessonForm, setLessonForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '', notes: '' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('students').select('*');
    let qLsn = supabase.from('lessons').select('*');
    let qPay = supabase.from('payments').select('*');

    if (role === 'teacher') {
      q = q.eq('teacher_id', uid);
      qLsn = qLsn.eq('teacher_id', uid);
      qPay = qPay.eq('teacher_id', uid);
    }
    
    const { data: stds } = await q;
    const { data: lsn } = await qLsn;
    const { data: pay } = await qPay;

    const enriched = (stds || []).map(s => {
      const sLsn = (lsn || []).filter(l => l.student_id === s.id);
      const sPay = (pay || []).filter(p => p.student_id === s.id);
      const paid = sPay.reduce((acc, p) => acc + Number(p.amount), 0);
      return {
        ...s,
        total_lessons: sLsn.length,
        total_hours: sLsn.reduce((acc, l) => acc + Number(l.hours), 0),
        total_paid: paid,
        remaining_balance: Number(s.agreed_payment) - paid
      };
    });
    setStudents(enriched);
    setLoading(false);
  }, [role, uid]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('students').insert([{
      ...form,
      agreed_payment: parseFloat(form.agreed_payment),
      teacher_id: uid
    }]);
    if (!error) { setIsModalOpen(false); setForm({ name: '', address: '', phone: '', grade: '', agreed_payment: '' }); fetchStudents(); }
  };

  const handleLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('lessons').insert([{
      ...lessonForm,
      student_id: selectedStudent.id,
      teacher_id: uid,
      hours: parseFloat(lessonForm.hours)
    }]);
    if (!error) { setIsLessonModalOpen(false); fetchStudents(); }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">الطلاب</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <Plus size={20} /> إضافة طالب
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          placeholder="ابحث عن طالب..." 
          className="w-full pr-12 pl-6 py-4 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold shadow-sm"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-slate-400">جاري تحميل القائمة...</div>
        ) : filtered.map(student => (
          <div key={student.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-slate-50 text-slate-800 rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {student.name.charAt(0)}
              </div>
              <button onClick={() => { setSelectedStudent(student); setIsLessonModalOpen(true); }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all">
                سجل حصة +
              </button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{student.name}</h3>
            <p className="text-indigo-600 font-bold mb-6">{student.grade}</p>
            <div className="space-y-3 text-slate-500 font-bold text-sm">
              <div className="flex items-center gap-2"><MapPin size={16} /> {student.address}</div>
              <div className="flex items-center gap-2"><Phone size={16} /> {student.phone}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">الحصص</p>
                <div className="flex items-center gap-1 font-black text-slate-900"><BookOpen size={16} /> {student.total_lessons}</div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">الساعات</p>
                <div className="flex items-center gap-1 font-black text-slate-900"><Clock size={16} /> {student.total_hours}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6 text-right">طالب جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required placeholder="الاسم" className="w-full p-4 border rounded-2xl text-right font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required placeholder="الصف" className="w-full p-4 border rounded-2xl text-right font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              <input required type="number" placeholder="المبلغ المتفق عليه ($)" className="w-full p-4 border rounded-2xl text-right font-bold" value={form.agreed_payment} onChange={e => setForm({...form, agreed_payment: e.target.value})} />
              <input required placeholder="الهاتف" className="w-full p-4 border rounded-2xl text-right font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <textarea required placeholder="العنوان" className="w-full p-4 border rounded-2xl text-right font-bold h-24" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold border rounded-2xl">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-1 text-right">تسجيل حصة</h2>
            <p className="text-slate-400 font-bold mb-6 text-right">{selectedStudent?.name}</p>
            <form onSubmit={handleLesson} className="space-y-4">
              <input required type="date" className="w-full p-4 border rounded-2xl text-right font-bold" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
              <input required type="number" step="0.5" placeholder="عدد الساعات" className="w-full p-4 border rounded-2xl text-right font-bold" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              <textarea placeholder="ملاحظات الحصة" className="w-full p-4 border rounded-2xl text-right font-bold h-24" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-4 font-bold border rounded-2xl">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100">تأكيد</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
