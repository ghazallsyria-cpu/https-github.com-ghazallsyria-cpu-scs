
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Student, StudentStats } from '../types';
import { 
  Plus, Search, MapPin, Phone, BookOpen, Clock, Users, AlertCircle
} from 'lucide-react';

const Students: React.FC = () => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [studentForm, setStudentForm] = useState({
    name: '', address: '', phone: '', grade: '', agreed_payment: ''
  });

  const [lessonForm, setLessonForm] = useState({
    lesson_date: new Date().toISOString().split('T')[0], hours: '', notes: ''
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: studentsData, error: sErr } = await supabase.from('students').select('*');
      if (sErr) throw sErr;

      const { data: lessonsData } = await supabase.from('lessons').select('*');
      const { data: paymentsData } = await supabase.from('payments').select('*');

      const enriched = (studentsData || []).map(student => {
        const studentLessons = (lessonsData || []).filter(l => l.student_id === student.id);
        const studentPayments = (paymentsData || []).filter(p => p.student_id === student.id);
        
        return {
          ...student,
          total_lessons: studentLessons.length,
          total_hours: studentLessons.reduce((sum, l) => sum + (Number(l.hours) || 0), 0),
          total_paid: studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
          remaining_balance: Number(student.agreed_payment || 0) - studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        };
      });

      setStudents(enriched);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('فشل في تحميل البيانات. يرجى التأكد من إعداد جداول Supabase بشكل صحيح.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([{
        name: studentForm.name,
        address: studentForm.address,
        phone: studentForm.phone,
        grade: studentForm.grade,
        agreed_payment: parseFloat(studentForm.agreed_payment)
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setStudentForm({ name: '', address: '', phone: '', grade: '', agreed_payment: '' });
      fetchStudents();
    } catch (err) { 
      alert('خطأ في إضافة الطالب. تأكد من وجود جدول students بالأعمدة المطلوبة.'); 
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const hoursNum = parseFloat(lessonForm.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('يرجى إدخال عدد ساعات صحيح');
      return;
    }

    try {
      const { error } = await supabase.from('lessons').insert([{
        student_id: selectedStudent.id,
        lesson_date: lessonForm.lesson_date,
        hours: hoursNum,
        notes: lessonForm.notes || ''
      }]);
      
      if (error) throw error;

      setIsLessonModalOpen(false);
      setLessonForm({ lesson_date: new Date().toISOString().split('T')[0], hours: '', notes: '' });
      fetchStudents();
      alert('✅ تم تسجيل الحصة بنجاح!');
    } catch (err: any) { 
      alert(`فشل الإضافة: ${err.message || 'تأكد من إنشاء جدول lessons في Supabase'}`);
    }
  };

  const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  if (error) return (
    <div className="flex flex-col items-center justify-center p-20 text-center">
      <AlertCircle size={48} className="text-rose-500 mb-4" />
      <h2 className="text-xl font-black text-slate-900 mb-2">حدث خطأ في الاتصال</h2>
      <p className="text-slate-500 mb-6 font-bold">{error}</p>
      <button onClick={fetchStudents} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">إعادة المحاولة</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900">إدارة الطلاب</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-md font-bold transition-all active:scale-95">
          <Plus size={18} /> إضافة طالب جديد
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="ابحث عن اسم الطالب..." 
          className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-bold text-right"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="font-bold text-slate-500">جاري تحميل قائمة الطلاب...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div key={student.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {student.name?.charAt(0) || '?'}
                </div>
                <button 
                  onClick={() => { setSelectedStudent(student); setIsLessonModalOpen(true); }} 
                  className="bg-emerald-600 text-white p-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
                >
                  <Plus size={14} /> سجل حصة
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{student.name}</h3>
              <p className="text-sm text-indigo-600 font-bold mb-4">{student.grade || 'بدون صف'}</p>
              
              <div className="space-y-2 mb-6 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-medium"><MapPin size={16} className="text-slate-400"/> <span className="truncate">{student.address || 'لا يوجد عنوان'}</span></div>
                <div className="flex items-center gap-2 font-medium"><Phone size={16} className="text-slate-400"/> <span>{student.phone || 'بدون هاتف'}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">الحصص</p>
                  <div className="flex justify-center items-center gap-1 font-black text-slate-900"><BookOpen size={14}/> {student.total_lessons}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">الساعات</p>
                  <div className="flex justify-center items-center gap-1 font-black text-slate-900"><Clock size={14}/> {student.total_hours}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto text-slate-300 mb-4" size={60} />
            <p className="text-slate-500 font-bold text-lg">لا يوجد طلاب مسجلين حالياً.</p>
          </div>
        )}
      </div>

      {/* مودالات (الإضافة والحصة) تبقى كما هي مع التأكد من Optional Chaining */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6 text-slate-900 text-right">إضافة طالب جديد</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">الاسم الكامل</label>
                <input required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">المبلغ المتفق عليه</label>
                  <input required type="number" className="w-full p-3 border rounded-xl outline-none text-right" value={studentForm.agreed_payment} onChange={e => setStudentForm({...studentForm, agreed_payment: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">الصف/المستوى</label>
                  <input required className="w-full p-3 border rounded-xl outline-none text-right" value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: e.target.value})} />
                </div>
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">رقم الهاتف</label>
                <input required className="w-full p-3 border rounded-xl outline-none text-right" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">العنوان</label>
                <textarea required className="w-full p-3 border rounded-xl outline-none h-24 text-right" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">حفظ الطالب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in duration-200 shadow-2xl">
            <h2 className="text-2xl font-black mb-2 text-slate-900 text-right">تسجيل حصة جديدة</h2>
            <p className="text-slate-500 mb-6 font-bold text-right">للطالب: <span className="text-indigo-600">{selectedStudent?.name}</span></p>
            <form onSubmit={handleAddLesson} className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">عدد الساعات</label>
                  <input required type="number" step="0.5" placeholder="مثال: 1.5" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-bold" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">التاريخ</label>
                  <input required type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-bold" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} />
                </div>
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">ملاحظات الدرس</label>
                <textarea placeholder="ماذا تم إنجازه في هذه الحصة؟" className="w-full p-3 border rounded-xl outline-none h-32 text-right font-bold" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">تأكيد الحفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
