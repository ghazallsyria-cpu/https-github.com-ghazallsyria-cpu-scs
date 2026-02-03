
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { StudentStats } from '../types';
import { Plus, Search, MapPin, Phone, BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Students = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
  const [lessonForm, setLessonForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '', notes: '' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
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
          remaining_balance: Number(s.agreed_amount) - paid
        };
      });
      setStudents(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role, uid]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('students').insert([{
      ...form,
      agreed_amount: parseFloat(form.agreed_amount),
      teacher_id: uid, // إجباري حسب البرومبت
      is_completed: false
    }]);
    if (!error) { setIsModalOpen(false); setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '' }); fetchStudents(); }
  };

  const handleToggleComplete = async (studentId: string, current: boolean) => {
    const { error } = await supabase.from('students').update({ is_completed: !current }).eq('id', studentId);
    if (!error) fetchStudents();
  };

  const handleLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('lessons').insert([{
      ...lessonForm,
      student_id: selectedStudent.id,
      teacher_id: uid, // إجباري حسب البرومبت
      hours: parseFloat(lessonForm.hours)
    }]);
    if (!error) { setIsLessonModalOpen(false); setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '', notes: '' }); fetchStudents(); }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">إدارة الطلاب</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
          <Plus size={20} /> إضافة طالب
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          placeholder="ابحث عن طالب بالاسم..." 
          className="w-full pr-12 pl-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-slate-400">جاري تحميل القائمة...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold">لا يوجد طلاب مطابقين للبحث.</div>
        ) : filtered.map(student => (
          <div key={student.id} className={`bg-white p-8 rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all group ${student.is_completed ? 'border-emerald-100' : 'border-slate-50'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${student.is_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'}`}>
                {student.name.charAt(0)}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button onClick={() => { setSelectedStudent(student); setIsLessonModalOpen(true); }} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all">
                  سجل حصة +
                </button>
                <button 
                  onClick={() => handleToggleComplete(student.id, student.is_completed)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${student.is_completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                >
                  {student.is_completed ? <><CheckCircle size={12}/> تم السداد</> : 'إنهاء المبلغ؟'}
                </button>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">{student.name}</h3>
            <p className="text-indigo-600 font-bold text-sm mb-6">{student.grade}</p>
            
            <div className="space-y-3 text-slate-500 font-bold text-sm">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-300" /> {student.address || 'لا يوجد عنوان'}</div>
              <div className="flex items-center gap-2"><Phone size={16} className="text-slate-300" /> {student.phone || 'لا يوجد هاتف'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">الحصص</p>
                <div className="flex items-center gap-1 font-black text-slate-900"><BookOpen size={16} className="text-slate-400"/> {student.total_lessons}</div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">إجمالي الساعات</p>
                <div className="flex items-center gap-1 font-black text-slate-900"><Clock size={16} className="text-slate-400"/> {student.total_hours}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl animate-in zoom-in duration-200 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-right">إضافة طالب جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required placeholder="اسم الطالب" className="w-full p-4 border rounded-2xl text-right font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required placeholder="الصف الدراسي" className="w-full p-4 border rounded-2xl text-right font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">المبلغ المتفق عليه ($)</label>
                <input required type="number" placeholder="0.00" className="w-full p-4 border rounded-2xl text-right font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
              </div>
              <input placeholder="رقم الهاتف" className="w-full p-4 border rounded-2xl text-right font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <textarea placeholder="العنوان" className="w-full p-4 border rounded-2xl text-right font-bold h-24 outline-none focus:ring-2 focus:ring-indigo-500" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold border rounded-2xl hover:bg-slate-50">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700">حفظ الطالب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl animate-in zoom-in duration-200 shadow-2xl">
            <h2 className="text-2xl font-black mb-1 text-right">تسجيل حصة دراسية</h2>
            <p className="text-slate-400 font-bold mb-6 text-right">للطالب: <span className="text-indigo-600">{selectedStudent?.name}</span></p>
            <form onSubmit={handleLesson} className="space-y-4">
              <input required type="date" className="w-full p-4 border rounded-2xl text-right font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
              <input required type="number" step="0.5" placeholder="عدد الساعات (مثال: 1.5)" className="w-full p-4 border rounded-2xl text-right font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              <textarea placeholder="ملاحظات الحصة (اختياري)" className="w-full p-4 border rounded-2xl text-right font-bold h-24 outline-none focus:ring-2 focus:ring-indigo-500" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-4 font-bold border rounded-2xl hover:bg-slate-50">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700">تأكيد الحصة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
