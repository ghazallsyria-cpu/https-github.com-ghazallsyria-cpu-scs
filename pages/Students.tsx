
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { StudentStats } from '../types.ts';
// Fix: Added missing 'Users' import from lucide-react
import { Plus, MapPin, Phone, Calendar, Search, Trash2, CheckCircle, GraduationCap, X, User, AlertCircle, Users } from 'lucide-react';

const Students = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<(StudentStats & { profiles?: { full_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [form, setForm] = useState({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
  const [lessonForm, setLessonForm] = useState({ lesson_date: new Date().toISOString().split('T')[0], hours: '1', notes: '' });
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // التحقق من صحة الاتصال بـ Supabase
      if (supabase.auth.getSession === undefined) {
        throw new Error("بيانات Supabase غير مضبوطة بشكل صحيح.");
      }

      let qSt = supabase.from('students').select('*, profiles:teacher_id(full_name)');
      let qLe = supabase.from('lessons').select('*');

      if (!isAdmin) {
        qSt = qSt.eq('teacher_id', uid);
        qLe = qLe.eq('teacher_id', uid);
      }

      const [{ data: stds, error: sErr }, { data: lsns, error: lErr }] = await Promise.all([qSt, qLe]);
      
      if (sErr) throw sErr;
      if (lErr) throw lErr;

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
    } catch (e: any) {
      console.error("Student Fetch Error:", e);
      if (e.message?.includes('recursion')) {
        showFeedback("مشكلة تقنية: تم اكتشاف تكرار في الصلاحيات. يرجى مراجعة المسؤول.", "error");
      } else if (e.message?.includes('missing')) {
        showFeedback("خطأ: بيانات الاتصال بقاعدة البيانات غير متوفرة.", "error");
      } else {
        showFeedback("فشل جلب بيانات الطلاب. تأكد من إعدادات الربط.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(form.agreed_amount) || 0;
      
      const { error } = await supabase.from('students').insert([{ 
        name: form.name,
        address: form.address,
        phone: form.phone,
        grade: form.grade,
        agreed_amount: amount,
        teacher_id: uid 
      }]);

      if (error) {
        if (error.message.includes('recursion')) throw new Error("خطأ في صلاحيات النظام (Recursion).");
        if (error.code === '42501') throw new Error("ليس لديك صلاحية لإضافة طلاب. تأكد من تفعيل حسابك.");
        throw error;
      }

      showFeedback('تمت إضافة الطالب بنجاح');
      setIsModalOpen(false);
      setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message || "حدث خطأ أثناء الإضافة", 'error');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const { error } = await supabase.from('lessons').insert([{
      student_id: selectedStudent.id,
      teacher_id: selectedStudent.teacher_id,
      lesson_date: lessonForm.lesson_date,
      hours: parseFloat(lessonForm.hours),
      notes: lessonForm.notes
    }]);
    if (error) showFeedback("فشل في تسجيل الحصة: " + error.message, 'error');
    else {
      showFeedback('تم تسجيل الحصة بنجاح');
      setIsLessonModalOpen(false);
      setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '1', notes: '' });
      fetchStudents();
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف الطالب؟')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) showFeedback("حدث خطأ أثناء الحذف: " + error.message, 'error');
    else {
      showFeedback('تم الحذف بنجاح');
      fetchStudents();
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all animate-in slide-in-from-top-full max-w-[90vw] text-center ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">إدارة الطلاب</h1>
          <p className="text-slate-500 font-bold mt-2">
            {isAdmin ? `إجمالي الطلاب في النظام: ${students.length}` : `لديك ${students.length} طالب مسجل.`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن طالب..." 
              className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-100"
          >
            <Plus size={20} /> طالب جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStudents.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:shadow-xl transition-all">
            {isAdmin && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 flex items-center gap-1 border border-slate-200">
                <User size={10} /> المعلم: {s.profiles?.full_name}
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6 mt-4">
              <div className="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl">
                {s.name.charAt(0)}
              </div>
              <div className="flex gap-1">
                 <button 
                  onClick={() => { setSelectedStudent(s); setIsLessonModalOpen(true); }}
                  className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                  title="تسجيل حصة"
                ><Calendar size={18}/></button>
                <button 
                  onClick={() => handleDeleteStudent(s.id)}
                  className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                  title="حذف الطالب"
                ><Trash2 size={18}/></button>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-1">{s.name}</h3>
            <p className="inline-block bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-6">{s.grade}</p>
            
            <div className="space-y-3 text-sm text-slate-500 font-bold mb-8">
              <div className="flex items-center gap-3"><MapPin size={16} className="text-indigo-400" /> {s.address}</div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-indigo-400" /> {s.phone}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
               <div className="text-center">
                 <p className="text-[10px] text-slate-400 font-black">حصص</p>
                 <p className="font-black text-slate-900 text-lg">{s.total_lessons}</p>
               </div>
               <div className="text-center border-x border-slate-100">
                 <p className="text-[10px] text-slate-400 font-black">ساعة</p>
                 <p className="font-black text-slate-900 text-lg">{s.total_hours}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-slate-400 font-black">الاتفاق</p>
                 <p className="font-black text-emerald-600 text-lg">${s.agreed_amount}</p>
               </div>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
            <Users size={64} className="mx-auto mb-6 text-slate-200" />
            <h3 className="text-xl font-black text-slate-400">لا يوجد طلاب مسجلون بعد.</h3>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 left-8 text-slate-300 hover:text-slate-600"><X size={24} /></button>
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                <GraduationCap size={28} />
              </div>
              <h2 className="text-3xl font-black text-slate-900">إضافة طالب جديد</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input required placeholder="الاسم" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required placeholder="الصف" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              <input required placeholder="الهاتف" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input required type="number" placeholder="الاتفاق المالي ($)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-left" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
              <input required placeholder="العنوان" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none md:col-span-2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl mt-8 shadow-xl">حفظ البيانات</button>
          </form>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddLesson} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="absolute top-8 left-8 text-slate-300 hover:text-slate-600"><X /></button>
            <h2 className="text-2xl font-black text-slate-900 mb-8">تسجيل حصة: {selectedStudent?.name}</h2>
            <div className="space-y-5">
              <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
              <input required type="number" step="0.5" placeholder="عدد الساعات" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              <textarea rows={3} placeholder="ملاحظات" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl">تأكيد الحصة</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
