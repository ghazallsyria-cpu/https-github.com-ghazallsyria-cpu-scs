
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, 
  GraduationCap, Trash2, Edit3, 
  ChevronRight, X, Clock, Copy, 
  Phone, DollarSign, BookOpen, Save, MoveHorizontal
} from 'lucide-react';

const Students = ({ isAdmin, profile }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState<'edit' | 'transfer' | 'lesson' | 'payment' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [form, setForm] = useState({
    name: '', grade: '12', address: '', academic_year: '2024-2025', semester: '1',
    agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
  });

  const [recordForm, setRecordForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], hours: '2', notes: '' });
  const [transferForm, setTransferForm] = useState({ year: '2025-2026', semester: '1' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('student_summary_view').select('*');
    if (!isAdmin) query = query.eq('teacher_id', profile.id);
    const { data } = await query.order('name');
    setStudents(data || []);
    setLoading(false);
  }, [isAdmin, profile.id]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAction = async (type: string) => {
    if (type === 'save_student') {
      const payload = { ...form, teacher_id: profile.id, agreed_amount: parseFloat(form.agreed_amount), price_per_hour: parseFloat(form.price_per_hour) };
      if (selectedStudent) await supabase.from('students').update(payload).eq('id', selectedStudent.id);
      else await supabase.from('students').insert([payload]);
    } else if (type === 'record_lesson') {
      await supabase.from('lessons').insert([{ student_id: selectedStudent.id, teacher_id: profile.id, lesson_date: recordForm.date, hours: parseFloat(recordForm.hours), notes: recordForm.notes }]);
    } else if (type === 'record_payment') {
      await supabase.from('payments').insert([{ student_id: selectedStudent.id, teacher_id: profile.id, payment_date: recordForm.date, amount: parseFloat(recordForm.amount), notes: recordForm.notes }]);
    } else if (type === 'transfer') {
      const { id, created_at, total_lessons, total_paid, remaining_balance, ...rest } = selectedStudent;
      await supabase.from('students').insert([{ ...rest, academic_year: transferForm.year, semester: transferForm.semester }]);
      alert("تم نقل الطالب للفصل الدراسي الجديد بنجاح.");
    }
    
    setActiveModal(null);
    setSelectedStudent(null);
    fetchStudents();
  };

  const openModal = (type: any, student: any = null) => {
    setSelectedStudent(student);
    if (student && type === 'edit') {
      setForm({
        name: student.name, grade: student.grade, address: student.address, academic_year: student.academic_year,
        semester: student.semester, agreed_amount: student.agreed_amount.toString(),
        is_hourly: student.is_hourly, price_per_hour: student.price_per_hour.toString(),
        phones: student.phones || [{number: '', label: 'الطالب'}]
      });
    }
    setActiveModal(type);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><Users size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">إدارة <span className="text-indigo-600">الطلاب</span></h2>
            <p className="text-slate-400 font-bold">المعلم: {profile?.full_name} | المادة: {profile?.subjects}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input placeholder="بحث بالاسم..." className="w-full md:w-64 p-5 bg-slate-50 border-none rounded-[2rem] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={() => openModal('edit')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:scale-105 transition-transform">
            <Plus size={22} /> إضافة طالب
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {students.filter(s => s.name.includes(searchTerm)).map(s => (
          <div key={s.id} className="bg-white p-10 rounded-[4rem] border shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
             <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-indigo-600 font-black text-3xl mb-6 shadow-inner">{s.name[0]}</div>
                <h4 className="font-black text-slate-900 text-2xl">{s.name}</h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase mt-2">
                   <GraduationCap size={14} /> الصف {s.grade} | {s.academic_year}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                   <span className="text-[10px] font-black text-slate-400 block mb-1">المتبقي</span>
                   <span className={`text-xl font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance}</span>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                   <span className="text-[10px] font-black text-slate-400 block mb-1">الحصص</span>
                   <span className="text-xl font-black text-slate-900">{s.total_lessons} حصة</span>
                </div>
             </div>

             <div className="flex flex-wrap gap-3">
                <button onClick={() => openModal('lesson', s)} className="flex-1 bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"><BookOpen size={16} /> حصة</button>
                <button onClick={() => openModal('payment', s)} className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"><DollarSign size={16} /> دفعة</button>
                <button onClick={() => openModal('edit', s)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><Edit3 size={18} /></button>
                <button onClick={() => openModal('transfer', s)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><MoveHorizontal size={18} /></button>
             </div>
          </div>
        ))}
      </div>

      {/* مودال النوافذ المختلفة */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-2xl p-12 rounded-[4rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-black">
                    {activeModal === 'edit' && (selectedStudent ? 'تعديل بيانات' : 'إضافة طالب جديد')}
                    {activeModal === 'lesson' && `تسجيل حصة لـ ${selectedStudent.name}`}
                    {activeModal === 'payment' && `تسجيل مبلغ من ${selectedStudent.name}`}
                    {activeModal === 'transfer' && `نقل الطالب ${selectedStudent.name}`}
                 </h3>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-100 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24}/></button>
              </div>

              {activeModal === 'edit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-sm font-black">الاسم</label><input className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-sm font-black">الصف</label>
                    <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                      <option value="10">العاشر</option><option value="11">الحادي عشر</option><option value="12">الثاني عشر</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2"><label className="text-sm font-black">رقم هاتف ولي الأمر (هام جداً للربط)</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.phones[0].number} onChange={e => {
                      const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                    }} />
                  </div>
                </div>
              )}

              {(activeModal === 'lesson' || activeModal === 'payment') && (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-sm font-black">التاريخ</label><input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={recordForm.date} onChange={e => setRecordForm({...recordForm, date: e.target.value})} /></div>
                      <div className="space-y-2"><label className="text-sm font-black">{activeModal === 'lesson' ? 'عدد الساعات' : 'المبلغ'}</label>
                        <input type="number" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={activeModal === 'lesson' ? recordForm.hours : recordForm.amount} onChange={e => setRecordForm({...recordForm, [activeModal === 'lesson' ? 'hours' : 'amount']: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-2"><label className="text-sm font-black">ملاحظات</label><textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-32" value={recordForm.notes} onChange={e => setRecordForm({...recordForm, notes: e.target.value})} /></div>
                </div>
              )}

              {activeModal === 'transfer' && (
                <div className="space-y-6">
                   <p className="text-slate-500 font-bold">سيتم نسخ بيانات الطالب وحساباته إلى الفصل الدراسي الجديد مع تصفير سجلات الحصص والدفعات هناك.</p>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-sm font-black">السنة الجديدة</label><input className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={transferForm.year} onChange={e => setTransferForm({...transferForm, year: e.target.value})} /></div>
                      <div className="space-y-2"><label className="text-sm font-black">الكورس</label>
                         <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={transferForm.semester} onChange={e => setTransferForm({...transferForm, semester: e.target.value})}>
                            <option value="1">كورس أول</option><option value="2">كورس ثان</option>
                         </select>
                      </div>
                   </div>
                </div>
              )}

              <button 
                onClick={() => {
                   if (activeModal === 'edit') handleAction('save_student');
                   else if (activeModal === 'lesson') handleAction('record_lesson');
                   else if (activeModal === 'payment') handleAction('record_payment');
                   else if (activeModal === 'transfer') handleAction('transfer');
                }} 
                className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-600 transition-all"
              >
                تأكيد العملية
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
