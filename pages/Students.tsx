
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { StudentStats } from '../types.ts';
import { Plus, MapPin, Phone, Calendar, Search, Trash2, CheckCircle, X, AlertCircle, Users, Edit3, Clock, DollarSign, ArrowRightLeft, Copy, CalendarDays, Layers } from 'lucide-react';

const Students = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<(StudentStats & { profiles?: { full_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [form, setForm] = useState({ 
    name: '', address: '', phone: '', grade: '', 
    agreed_amount: '0', is_hourly: false, price_per_hour: '0' 
  });
  
  const [transferForm, setTransferForm] = useState({
    targetYear: year,
    targetSemester: semester === '1' ? '2' : '1',
    copyFullData: false
  });

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
      let query = supabase.from('students').select(`
        *,
        profiles:teacher_id (
          full_name
        )
      `).eq('academic_year', year).eq('semester', semester);
      
      if (!isAdmin) {
        query = query.eq('teacher_id', uid);
      }

      const { data: stds, error: sErr } = await query;
      if (sErr) throw sErr;

      const { data: lsns, error: lErr } = await supabase.from('lessons').select('student_id, hours');
      if (lErr) throw lErr;

      const { data: pays, error: pErr } = await supabase.from('payments').select('student_id, amount');
      if (pErr) throw pErr;

      const enriched = (stds || []).map(s => {
        const studentLessons = (lsns || []).filter(l => l.student_id === s.id);
        const studentPayments = (pays || []).filter(p => p.student_id === s.id);
        const profileData = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        
        const totalHours = studentLessons.reduce((acc, l) => acc + Number(l.hours), 0);
        const totalPaid = studentPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        const expectedIncome = s.is_hourly ? (totalHours * Number(s.price_per_hour)) : Number(s.agreed_amount);
        
        return {
          ...s,
          profiles: profileData,
          total_lessons: studentLessons.length,
          total_hours: totalHours,
          total_paid: totalPaid,
          expected_income: expectedIncome,
          remaining_balance: expectedIncome - totalPaid
        };
      });
      
      setStudents(enriched);
    } catch (e: any) {
      console.error("Fetch Error:", e);
      showFeedback("فشل جلب البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([{ 
        name: form.name,
        address: form.address,
        phone: form.phone,
        grade: form.grade,
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly,
        price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
        teacher_id: uid,
        academic_year: year,
        semester: semester
      }]);

      if (error) throw error;
      showFeedback('تمت إضافة الطالب بنجاح للفصل الحالي');
      setIsModalOpen(false);
      setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '0', is_hourly: false, price_per_hour: '0' });
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('students').update({
        name: form.name,
        address: form.address,
        phone: form.phone,
        grade: form.grade,
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly,
        price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
      }).eq('id', selectedStudent.id);

      if (error) throw error;
      showFeedback('تم تحديث بيانات الطالب بنجاح');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // وظيفة نقل/نسخ الطالب لفصل آخر
  const handleTransferStudent = async () => {
    if (!selectedStudent) return;
    try {
      setLoading(true);
      // 1. إنشاء سجل الطالب الجديد
      const { data: newStudent, error: sErr } = await supabase.from('students').insert([{
        name: selectedStudent.name,
        address: selectedStudent.address,
        phone: selectedStudent.phone,
        grade: selectedStudent.grade,
        agreed_amount: selectedStudent.agreed_amount,
        is_hourly: selectedStudent.is_hourly,
        price_per_hour: selectedStudent.price_per_hour,
        teacher_id: selectedStudent.teacher_id,
        academic_year: transferForm.targetYear,
        semester: transferForm.targetSemester
      }]).select().single();

      if (sErr) throw sErr;

      // 2. إذا تم اختيار نقل البيانات كاملة
      if (transferForm.copyFullData && newStudent) {
        // جلب الحصص القديمة
        const { data: oldLessons } = await supabase.from('lessons').select('*').eq('student_id', selectedStudent.id);
        if (oldLessons && oldLessons.length > 0) {
          const newLessons = oldLessons.map(l => ({
            student_id: newStudent.id,
            teacher_id: l.teacher_id,
            lesson_date: l.lesson_date,
            hours: l.hours,
            notes: l.notes + " (تم نسخه من فصل سابق)"
          }));
          await supabase.from('lessons').insert(newLessons);
        }

        // جلب المدفوعات القديمة
        const { data: oldPayments } = await supabase.from('payments').select('*').eq('student_id', selectedStudent.id);
        if (oldPayments && oldPayments.length > 0) {
          const newPayments = oldPayments.map(p => ({
            student_id: newStudent.id,
            teacher_id: p.teacher_id,
            amount: p.amount,
            payment_date: p.payment_date,
            notes: p.notes + " (تم نسخه من فصل سابق)"
          }));
          await supabase.from('payments').insert(newPayments);
        }
      }

      showFeedback(`تم بنجاح نقل الطالب إلى ${transferForm.targetYear} - الفصل ${transferForm.targetSemester}`);
      setIsTransferModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
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
    if (!confirm('هل أنت متأكد من حذف الطالب؟ سيتم حذف كافة حصصه ومدفوعاته أيضاً من هذا الفصل.')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) showFeedback(error.message, 'error');
    else fetchStudents();
  };

  const openEditModal = (student: any) => {
    setSelectedStudent(student);
    setForm({
      name: student.name,
      address: student.address,
      phone: student.phone,
      grade: student.grade,
      agreed_amount: student.agreed_amount?.toString() || '0',
      is_hourly: student.is_hourly,
      price_per_hour: student.price_per_hour?.toString() || '0'
    });
    setIsEditModalOpen(true);
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
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full">{year}</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">الفصل {semester}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">إدارة الطلاب</h1>
          <p className="text-slate-500 font-bold mt-2">
            عرض طلابك في الفترة الزمنية المحددة.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث..." 
              className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-bold text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setForm({ name: '', address: '', phone: '', grade: '', agreed_amount: '0', is_hourly: false, price_per_hour: '0' }); setIsModalOpen(true); }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95"
          >
            إضافة طالب جديد
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.map(s => (
            <div key={s.id} className={`bg-white p-8 rounded-[2.5rem] border transition-all relative group hover:shadow-xl ${s.is_hourly ? 'border-amber-200' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl">
                  {s.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setSelectedStudent(s); setIsTransferModalOpen(true); }} className="p-3 bg-slate-50 rounded-xl hover:bg-amber-600 hover:text-white transition-all text-slate-400" title="نقل لفصل آخر"><ArrowRightLeft size={18}/></button>
                  <button onClick={() => openEditModal(s)} className="p-3 bg-slate-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-slate-400" title="تعديل"><Edit3 size={18}/></button>
                  <button onClick={() => { setSelectedStudent(s); setIsLessonModalOpen(true); }} className="p-3 bg-slate-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-slate-400" title="حصة جديدة"><Calendar size={18}/></button>
                  <button onClick={() => handleDeleteStudent(s.id)} className="p-3 bg-slate-50 rounded-xl hover:bg-rose-600 hover:text-white transition-all text-slate-400" title="حذف"><Trash2 size={18}/></button>
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
                   <p className="text-[10px] text-slate-400 font-black">{s.is_hourly ? 'سعر الساعة' : 'الاتفاق'}</p>
                   <p className={`font-black ${s.is_hourly ? 'text-amber-600' : 'text-emerald-600'}`}>
                     ${s.is_hourly ? s.price_per_hour : s.agreed_amount}
                   </p>
                 </div>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <Users size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold">لا يوجد طلاب في السنة {year} الفصل {semester}.</p>
            </div>
          )}
        </div>
      )}

      {/* نافذة نقل الطالب لفصل آخر */}
      {isTransferModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300 border-2 border-amber-100">
            <button onClick={() => setIsTransferModalOpen(false)} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500"><X /></button>
            <div className="flex items-center gap-3 mb-8 text-amber-600">
              <ArrowRightLeft size={32} />
              <h2 className="text-2xl font-black text-slate-900 leading-tight">نقل الطالب لفصل آخر</h2>
            </div>
            
            <p className="text-slate-500 font-bold text-sm mb-8 bg-slate-50 p-4 rounded-2xl">
              أنت تقوم بنقل بيانات <span className="text-indigo-600">{selectedStudent.name}</span> من فصلك الحالي لفترة زمنية جديدة.
            </p>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={12}/> السنة الدراسية المستهدفة
                 </label>
                 <select 
                   className="w-full p-4 bg-slate-100 border-none rounded-2xl font-black outline-none"
                   value={transferForm.targetYear}
                   onChange={e => setTransferForm({...transferForm, targetYear: e.target.value})}
                 >
                   <option value="2023-2024">2023-2024</option>
                   <option value="2024-2025">2024-2025</option>
                   <option value="2025-2026">2025-2026</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12}/> الفصل الدراسي المستهدف
                 </label>
                 <select 
                   className="w-full p-4 bg-slate-100 border-none rounded-2xl font-black outline-none"
                   value={transferForm.targetSemester}
                   onChange={e => setTransferForm({...transferForm, targetSemester: e.target.value})}
                 >
                   <option value="1">الفصل الدراسي الأول</option>
                   <option value="2">الفصل الدراسي الثاني</option>
                 </select>
               </div>

               <label className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl cursor-pointer group hover:bg-indigo-100 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-indigo-600"
                    checked={transferForm.copyFullData}
                    onChange={e => setTransferForm({...transferForm, copyFullData: e.target.checked})}
                  />
                  <div>
                    <p className="text-sm font-black text-indigo-700">نسخ كامل السجلات (حصص + مالية)</p>
                    <p className="text-[10px] text-indigo-400 font-bold">في حال عدم التفعيل، سيتم نقل بيانات الطالب الأساسية فقط.</p>
                  </div>
               </label>

               <button 
                onClick={handleTransferStudent}
                className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-3xl shadow-xl shadow-amber-100 flex items-center justify-center gap-3 transition-all active:scale-95"
               >
                 <Copy size={20}/> تأكيد عملية النقل
               </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة/تعديل طالب */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={isEditModalOpen ? handleUpdateStudent : handleAddStudent} className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">{isEditModalOpen ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد للفصل'}</h2>
            
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-8 w-fit mx-auto">
              <button 
                type="button" 
                onClick={() => setForm({...form, is_hourly: false})} 
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${!form.is_hourly ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                نظام الاتفاق الفصلي
              </button>
              <button 
                type="button" 
                onClick={() => setForm({...form, is_hourly: true})} 
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${form.is_hourly ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400'}`}
              >
                نظام الساعة
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الاسم الكامل</label>
                <input required placeholder="الاسم" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الصف الدراسي</label>
                <input required placeholder="مثال: ثالث ثانوي" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">رقم الهاتف</label>
                <input required placeholder="09xxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              
              {!form.is_hourly ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">مبلغ الاتفاق الكامل ($)</label>
                  <input required type="number" placeholder="0" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">سعر الساعة ($)</label>
                  <input required type="number" placeholder="0" className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-700" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                </div>
              )}

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">العنوان</label>
                <input required placeholder="المدينة، الشارع..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl mt-8 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              {isEditModalOpen ? 'حفظ التعديلات' : 'إضافة الطالب للفصل الحالي'}
            </button>
          </form>
        </div>
      )}

      {/* نافذة إضافة حصة */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddLesson} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
            <h2 className="text-xl font-black mb-6 text-slate-900">تسجيل حصة لـ {selectedStudent?.name}</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">تاريخ الحصة</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">عدد الساعات</label>
                <input required type="number" step="0.5" placeholder="مثال: 1.5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">ملاحظات الدرس</label>
                <textarea placeholder="ماذا تم إنجازه؟" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-32" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl active:scale-95">تأكيد الحصة</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
