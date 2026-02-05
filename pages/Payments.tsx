
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { Wallet, Plus, X, DollarSign, CheckCircle, AlertCircle, Trash2, Search, Edit3, Save, RefreshCw, Folder, FolderOpen } from 'lucide-react';

const Payments = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedGradeFolder, setSelectedGradeFolder] = useState<string>('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    payment_date: new Date().toISOString().split('T')[0], 
    notes: '',
    payment_method: 'كاش',
    payment_number: 'الأولى',
    is_final: false
  });
  
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      let qStds = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds;

      const studentIds = stds?.map(s => s.id) || [];
      let qPays = supabase.from('payments').select('*, students(name)').in('student_id', studentIds);
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      const { data: pays } = await qPays;
      
      setAllPayments(pays || []);
      setStudents(stds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const handleOpenAdd = (student: any) => {
    setSelectedStudent(student);
    setIsEditMode(false);
    setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', payment_method: 'كاش', payment_number: 'الأولى', is_final: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (payment: any) => {
    setSelectedPaymentId(payment.id);
    setIsEditMode(true);
    setPaymentForm({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      notes: payment.notes || '',
      payment_method: payment.payment_method,
      payment_number: payment.payment_number,
      is_final: payment.is_final
    });
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        payment_number: paymentForm.payment_number,
        is_final: paymentForm.is_final,
        notes: paymentForm.notes
      };

      if (isEditMode && selectedPaymentId) {
        const { error } = await supabase.from('payments').update(payload).eq('id', selectedPaymentId);
        if (error) throw error;
        showFeedback("تم تحديث الدفعة بنجاح");
      } else {
        const { error } = await supabase.from('payments').insert([{ ...payload, student_id: selectedStudent.id, teacher_id: uid }]);
        if (error) throw error;
        showFeedback("تم تسجيل الدفعة بنجاح");
      }
      setIsModalOpen(false);
      fetchFinancialData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل المالي؟')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) showFeedback("فشل الحذف", 'error');
    else {
      showFeedback("تم الحذف بنجاح");
      fetchFinancialData();
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesFolder = selectedGradeFolder === 'الكل' || s.grade === selectedGradeFolder;
      const matchesSearch = s.name.includes(searchTerm);
      return matchesFolder && matchesSearch;
    });
  }, [students, selectedGradeFolder, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right pb-20 font-['Cairo']">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100"><Wallet size={32}/></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">المركز المالي</h1>
            <p className="text-slate-400 font-bold text-sm">إدارة وتحرير دفعات الطلاب</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
           <input placeholder="ابحث عن طالب..." className="w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:bg-white transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Folders */}
      <div className="flex flex-wrap gap-4">
        {['الكل', '10', '11', '12'].map((folder) => (
          <button key={folder} onClick={() => setSelectedGradeFolder(folder)} className={`flex-1 min-w-[120px] p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selectedGradeFolder === folder ? 'border-indigo-600 bg-white shadow-xl -translate-y-1' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
            <div className={`p-3 rounded-2xl ${selectedGradeFolder === folder ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm'}`}>
              {selectedGradeFolder === folder ? <FolderOpen size={24} /> : <Folder size={24} />}
            </div>
            <span className="font-black text-xs">{folder === 'الكل' ? 'كافة الطلاب' : `الصف ${folder}`}</span>
          </button>
        ))}
      </div>

      {/* Students List with Payments Expansion */}
      <div className="grid grid-cols-1 gap-6">
        {filteredStudents.map(s => (
          <div key={s.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
               <div className="text-center md:text-right">
                 <h3 className="text-2xl font-black text-slate-900">{s.name}</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">الصف {s.grade} | المتبقي: <span className="text-rose-600 font-black">${s.remaining_balance.toLocaleString()}</span></p>
               </div>
               <button onClick={() => handleOpenAdd(s)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"><Plus size={20}/> تسجيل دفعة</button>
            </div>
            
            <div className="p-8 space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={14}/> سجل الدفعات السابقة</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allPayments.filter(p => p.student_id === s.id).map(p => (
                    <div key={p.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] flex justify-between items-center group hover:border-indigo-500 transition-all">
                       <div>
                         <p className="font-black text-slate-900">${p.amount} <span className="text-[10px] text-slate-400">({p.payment_method})</span></p>
                         <p className="text-[10px] text-slate-400 font-bold">{p.payment_number} - {p.payment_date}</p>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => handleOpenEdit(p)} className="p-2 text-indigo-400 hover:text-indigo-600 transition-all"><Edit3 size={18}/></button>
                         <button onClick={() => handleDeletePayment(p.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><Trash2 size={18}/></button>
                       </div>
                    </div>
                  ))}
                  {allPayments.filter(p => p.student_id === s.id).length === 0 && (
                    <p className="text-slate-300 font-bold text-xs italic py-4">لا توجد دفعات مسجلة بعد لهذا الطالب.</p>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSavePayment} className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">{isEditMode ? 'تعديل دفعة مالية' : 'تسجيل دفعة جديدة'}</h2>
            
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">المبلغ ($)</label>
                 <input required type="number" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-black text-3xl text-center focus:bg-white focus:border-indigo-500 transition-all outline-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">الوسيلة</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                       <option value="كاش">كاش</option>
                       <option value="كي نت">كي نت</option>
                       <option value="ومض">ومض</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase">رقم الدفعة</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" value={paymentForm.payment_number} onChange={e => setPaymentForm({...paymentForm, payment_number: e.target.value})}>
                       <option value="الأولى">الأولى</option>
                       <option value="الثانية">الثانية</option>
                       <option value="الثالثة">الثالثة</option>
                       <option value="الأخيرة">الأخيرة</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">التاريخ</label>
                 <input type="date" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">ملاحظات</label>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs h-24 outline-none" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
               </div>
            </div>

            <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] mt-10 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {loading ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
              {isEditMode ? 'حفظ التعديلات' : 'تأكيد الاستلام'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Payments;
