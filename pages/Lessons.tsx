
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { 
  Calendar, Clock, BookOpen, Search, Trash2, User, CheckCircle, AlertCircle, Edit3, X, Folder, ChevronLeft, Plus, Info, 
  Wallet, DollarSign, History, MessageCircle, School, Star, Target, TrendingUp 
} from 'lucide-react';

const Lessons = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [studentLessons, setStudentLessons] = useState<any[]>([]);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'payments' | 'academic'>('lessons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'كاش', payment_number: 'الأولى', is_final: false, notes: ''
  });

  const [academicForm, setAcademicForm] = useState({ status_notes: '', weaknesses: '' });

  const fetchStudents = useCallback(async () => {
    let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
    if (role !== 'admin') query = query.eq('teacher_id', uid);
    const { data } = await query.order('name');
    setStudents(data || []);
  }, [uid, role, year, semester]);

  const fetchRecords = async (sid: string) => {
    setLoading(true);
    const [l, p, a] = await Promise.all([
      supabase.from('lessons').select('*').eq('student_id', sid).order('lesson_date', { ascending: false }),
      supabase.from('payments').select('*').eq('student_id', sid).order('payment_date', { ascending: false }),
      supabase.from('academic_records').select('*').eq('student_id', sid).order('created_at', { ascending: false })
    ]);
    setStudentLessons(l.data || []);
    setStudentPayments(p.data || []);
    setAcademicRecords(a.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { if (selectedStudent) fetchRecords(selectedStudent.id); }, [selectedStudent?.id]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('payments').insert([{
      ...paymentForm, amount: parseFloat(paymentForm.amount), 
      student_id: selectedStudent.id, teacher_id: uid
    }]);
    if (!error) { 
      setIsModalOpen(false); 
      fetchRecords(selectedStudent.id); 
      fetchStudents();
    }
  };

  const handleAddAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('academic_records').insert([{
      ...academicForm, student_id: selectedStudent.id, teacher_id: uid
    }]);
    if (!error) { setAcademicForm({ status_notes: '', weaknesses: '' }); fetchRecords(selectedStudent.id); }
  };

  // حساب معدل ثمن الحصة عند تسديد الذمة
  const averagePrice = selectedStudent && selectedStudent.remaining_balance <= 0 && selectedStudent.total_lessons > 0
    ? (selectedStudent.total_paid / selectedStudent.total_lessons).toFixed(2)
    : null;

  return (
    <div className="space-y-6 text-right pb-20">
      {!selectedStudent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(s => (
            <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-white p-6 rounded-[2.5rem] border hover:border-indigo-600 cursor-pointer transition-all">
               <h3 className="text-xl font-black text-slate-900">{s.name}</h3>
               <p className="text-xs text-slate-400 font-bold mb-4">الصف {s.grade} | {s.school_name || 'بلا مدرسة'}</p>
               <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400">المتبقي: <span className="text-rose-600">${s.remaining_balance}</span></span>
                  <ChevronLeft size={16} className="text-indigo-600"/>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedStudent(null)} className="text-indigo-600 font-black text-xs flex items-center gap-1 hover:underline"><ChevronLeft size={14} className="rotate-180"/> العودة</button>
          
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h2 className="text-3xl font-black">{selectedStudent.name}</h2>
                   <p className="text-slate-400 text-sm font-bold flex items-center gap-2 mt-2"><School size={16}/> {selectedStudent.school_name || 'لم تحدد المدرسة'}</p>
                   <div className="flex gap-2 mt-4">
                      {selectedStudent.phones?.map((p:any, i:number) => (
                        <a key={i} href={`https://wa.me/${p.number}`} target="_blank" className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-2 hover:bg-emerald-500/20"><MessageCircle size={14}/> {p.label}</a>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                   <div className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-[9px] text-slate-400 font-black mb-1 uppercase">ميزانية الفصل</p>
                      <p className="text-2xl font-black text-indigo-400">${selectedStudent.expected_income}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-[9px] text-slate-400 font-black mb-1 uppercase">إجمالي المسدد</p>
                      <p className="text-2xl font-black text-emerald-400">${selectedStudent.total_paid}</p>
                   </div>
                   {averagePrice && (
                     <div className="bg-indigo-500/20 p-4 rounded-2xl col-span-2 border border-indigo-500/30 flex justify-between items-center px-8 animate-in zoom-in">
                        <p className="text-[10px] text-indigo-200 font-black uppercase flex items-center gap-2"><Star size={14}/> معدل ثمن الحصة</p>
                        <p className="text-2xl font-black text-white">${averagePrice}</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="bg-white p-2 rounded-[2rem] border flex w-full max-w-lg mx-auto shadow-sm">
             {['lessons', 'payments', 'academic'].map((t) => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 rounded-[1.5rem] font-black text-xs transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                 {t === 'lessons' ? 'الدروس' : t === 'payments' ? 'المالية' : 'السجل الدراسي'}
               </button>
             ))}
          </div>

          <div className="bg-white rounded-[3rem] border shadow-sm p-8 min-h-[400px]">
            {activeTab === 'academic' && (
              <div className="space-y-8 animate-in fade-in">
                 <form onSubmit={handleAddAcademic} className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4">
                    <h4 className="font-black text-slate-900 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600"/> إضافة تقرير جديد</h4>
                    <textarea required placeholder="الملاحظات الدراسية العامة.." className="w-full p-4 border rounded-2xl h-24 font-bold text-sm" value={academicForm.status_notes} onChange={e => setAcademicForm({...academicForm, status_notes: e.target.value})} />
                    <textarea required placeholder="نقاط الضعف التي يجب متابعتها.." className="w-full p-4 border rounded-2xl h-24 font-bold text-sm text-rose-600" value={academicForm.weaknesses} onChange={e => setAcademicForm({...academicForm, weaknesses: e.target.value})} />
                    <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl">حفظ التقرير الدراسي</button>
                 </form>
                 <div className="space-y-4">
                   {academicRecords.map(r => (
                     <div key={r.id} className="p-6 border rounded-[2rem] bg-white hover:border-indigo-200 transition-all">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                           <Target size={16} className="text-indigo-400"/>
                        </div>
                        <p className="font-bold text-slate-700 mb-3">{r.status_notes}</p>
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                           <p className="text-[10px] font-black text-rose-400 uppercase mb-1">نقاط الضعف</p>
                           <p className="text-xs font-black text-rose-700">{r.weaknesses}</p>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-900">سجل المدفوعات النقدية</h3>
                  <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100">+ تسجيل دفعة</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   {studentPayments.map(p => (
                     <div key={p.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className="bg-white p-3 rounded-2xl text-emerald-600 font-black border border-emerald-100">${p.amount}</div>
                           <div>
                              <p className="font-black text-slate-900 text-sm">الدفعة {p.payment_number} {p.is_final && <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-md mr-1">الأخيرة</span>}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{p.payment_method} | {new Date(p.payment_date).toLocaleDateString('ar-EG')}</p>
                           </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium italic">{p.notes}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentLessons.map(l => (
                    <div key={l.id} className="p-5 border rounded-[2rem] flex justify-between items-center group hover:bg-slate-50 transition-all">
                       <div>
                          <p className="font-black text-slate-900">{new Date(l.lesson_date).toLocaleDateString('ar-EG', {dateStyle:'full'})}</p>
                          <p className="text-xs text-slate-400 font-bold">{l.hours} ساعة تدريسية</p>
                       </div>
                       <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><BookOpen size={20}/></div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 text-right">
          <form onSubmit={handleAddPayment} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative">
            <h2 className="text-2xl font-black mb-8 text-slate-900">تسجيل دفعة نقدية</h2>
            <div className="space-y-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">المبلغ ($)</label>
                 <input required type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">وسيلة الدفع</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value as any})}>
                       <option value="كاش">كاش (نقدي)</option>
                       <option value="كي نت">كي نت (Knet)</option>
                       <option value="ومض">ومض (Womda)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">رقم الدفعة</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs" value={paymentForm.payment_number} onChange={e => setPaymentForm({...paymentForm, payment_number: e.target.value})}>
                       <option value="الأولى">الأولى</option>
                       <option value="الثانية">الثانية</option>
                       <option value="الثالثة">الثالثة</option>
                       <option value="الرابعة">الرابعة</option>
                       <option value="الخامسة">الخامسة</option>
                    </select>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <input type="checkbox" checked={paymentForm.is_final} onChange={e => setPaymentForm({...paymentForm, is_final: e.target.checked})} />
                  <label className="text-xs font-black text-amber-700">هذه هي الدفعة الأخيرة؟</label>
               </div>
               <textarea placeholder="ملاحظات إضافية.." className="w-full p-4 bg-slate-50 border rounded-2xl font-bold h-24" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
            </div>
            <button className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl mt-8 shadow-xl">تأكيد استلام الدفعة</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-400 font-bold mt-2">إلغاء</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
