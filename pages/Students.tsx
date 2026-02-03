
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { StudentStats } from '../types.ts';
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
      // جلب الطلاب مع اسم المعلم (Profile)
      let query = supabase.from('students').select(`
        *,
        profiles (
          full_name
        )
      `);
      
      if (!isAdmin) {
        query = query.eq('teacher_id', uid);
      }

      const { data: stds, error: sErr } = await query;
      if (sErr) throw sErr;

      // جلب إحصائيات الدروس بشكل منفصل لتقليل تعقيد الاستعلام وتجنب الـ Recursion في السياسات
      const { data: lsns, error: lErr } = await supabase.from('lessons').select('student_id, hours');
      if (lErr) throw lErr;

      const enriched = (stds || []).map(s => {
        const studentLessons = (lsns || []).filter(l => l.student_id === s.id);
        const profileData = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        
        return {
          ...s,
          profiles: profileData,
          total_lessons: studentLessons.length,
          total_hours: studentLessons.reduce((acc, l) => acc + Number(l.hours), 0),
          total_paid: 0,
          remaining_balance: 0
        };
      });
      
      setStudents(enriched);
    } catch (e: any) {
      console.error("Fetch Error:", e);
      showFeedback(e.message || "فشل جلب بيانات الطلاب. تأكد من إعدادات الربط.", "error");
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([{ 
        name: form.name,
        address: form.address,
        phone: form.phone,
        grade: form.grade,
        agreed_amount: parseFloat(form.agreed_amount) || 0,
        teacher_id: uid 
      }]);

      if (error) throw error;

      showFeedback('تمت إضافة الطالب بنجاح');
      setIsModalOpen(false);
      setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('lessons').insert([{
        student_id: selectedStudent.id,
        teacher_id: selectedStudent.teacher_id,
        lesson_date: lessonForm.lesson_date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      }]);
      if (error) throw error;
      showFeedback('تم تسجيل الحصة بنجاح');
      setIsLessonModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف الطالب؟')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) showFeedback(error.message, 'error');
    else fetchStudents();
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">إدارة الطلاب</h1>
          <p className="text-slate-500 font-bold mt-2">
            {isAdmin ? "وضع الإدارة العامة: عرض كافة المعلمين والطلاب" : `أهلاً بك، لديك ${students.length} طالب مسجل.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث..." 
              className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all"
          >
            إضافة طالب
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.map(s => (
            <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:shadow-xl transition-all">
              {isAdmin && s.profiles && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black shadow-lg">
                  المعلم: {s.profiles.full_name}
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl">
                  {s.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setSelectedStudent(s); setIsLessonModalOpen(true); }} className="p-3 bg-slate-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Calendar size={18}/></button>
                  <button onClick={() => handleDeleteStudent(s.id)} className="p-3 bg-slate-50 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900">{s.name}</h3>
              <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest">{s.grade}</p>
              
              <div className="space-y-3 text-sm text-slate-500 font-bold mb-8">
                <div className="flex items-center gap-3"><MapPin size={16} className="text-indigo-400" /> {s.address}</div>
                <div className="flex items-center gap-3"><Phone size={16} className="text-indigo-400" /> {s.phone}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                 <div className="text-center">
                   <p className="text-[10px] text-slate-400 font-black">حصص</p>
                   <p className="font-black text-slate-900">{s.total_lessons}</p>
                 </div>
                 <div className="text-center border-x border-slate-100">
                   <p className="text-[10px] text-slate-400 font-black">ساعة</p>
                   <p className="font-black text-slate-900">{s.total_hours}</p>
                 </div>
                 <div className="text-center">
                   <p className="text-[10px] text-slate-400 font-black">الاتفاق</p>
                   <p className="font-black text-emerald-600">${s.agreed_amount}</p>
                 </div>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <Users size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold">لا يوجد طلاب لعرضهم.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 left-8 text-slate-400"><X /></button>
            <h2 className="text-2xl font-black mb-8">إضافة طالب جديد</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="الاسم" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required placeholder="الصف" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              <input required placeholder="الهاتف" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input required type="number" placeholder="الاتفاق ($)" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
              <input required placeholder="العنوان" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none md:col-span-2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl mt-8">حفظ</button>
          </form>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddLesson} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="absolute top-8 left-8 text-slate-400"><X /></button>
            <h2 className="text-xl font-black mb-6">تسجيل حصة لـ {selectedStudent?.name}</h2>
            <div className="space-y-4">
              <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
              <input required type="number" step="0.5" placeholder="عدد الساعات" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              <textarea placeholder="ملاحظات" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl">تأكيد الحصة</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
