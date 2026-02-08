
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, CheckCircle, AlertCircle, Trash2, 
  Search, RefreshCw, Folder, FolderOpen, AlertTriangle, CheckCircle2 
} from 'lucide-react';

const Payments = ({ role, uid, year, semester, isAdmin: isAdminProp }: { role: any, uid: any, year: string, semester: string, isAdmin?: boolean }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    payment_date: new Date().toISOString().split('T')[0], 
    notes: '',
    payment_method: 'كاش',
    payment_number: 'الأولى',
    is_final: false
  });
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  
  const isAdmin = role === 'admin';

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. جلب ملخص الطلاب المالي من الـ View
      let qStds = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds, error: stdsError } = await qStds.order('name');
      
      if (stdsError) throw stdsError;
      setStudents(stds || []);

      // 2. جلب كافة الدفعات المسجلة لهؤلاء الطلاب
      if (stds && stds.length > 0) {
        const studentIds = stds.map(s => s.id);
        let qPays = supabase.from('payments').select('*, students(name)').in('student_id', studentIds);
        if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
        const { data: pays, error: paysError } = await qPays.order('payment_date', { ascending: false });
        
        if (paysError) throw paysError;
        setAllPayments(pays || []);
      } else {
        setAllPayments([]);
      }
    } catch (err: any) {
      console.error("Financial Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { 
    fetchFinancialData(); 
  }, [fetchFinancialData]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("يرجى إدخال مبلغ صحيح.");
      return;
    }

    if (paymentForm.is_final) {
        if (!confirm("هل أنت متأكد من وسم هذه الدفعة كدفعة نهائية؟ سيتم اعتبار الطالب قد سدد كامل المبلغ المتفق عليه.")) return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        payment_number: paymentForm.payment_number,
        is_final: paymentForm.is_final,
        notes: paymentForm.notes,
        student_id: selectedStudent.id,
        teacher_id: uid
      };

      const { error } = await supabase.from('payments').insert([payload]);
      if (error) throw error;

      setSuccessMsg(`تم تسجيل دفعة بقيمة $${paymentForm.amount} للطالب ${selectedStudent.name}`);
      setIsModalOpen(false); 
      setPaymentForm({ ...paymentForm, amount: '', notes: '', is_final: false });
      
      // تحديث البيانات فوراً
      await fetchFinancialData();
      
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) { 
      alert("خطأ في حفظ الدفعة: " + err.message); 
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      setConfirmDeleteId(null);
      await fetchFinancialData();
    } catch (err: any) {
      alert("فشل حذف الدفعة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Wallet size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">المركز <span className="text-indigo-600">المالي</span></h2>
            <p className="text-slate-400 font-bold">تتبع الدفعات والمستحقات بدقة عالية.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input placeholder="بحث باسم الطالب..." className="w-full pr-12 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-2 ring-indigo-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <button onClick={fetchFinancialData} className="p-5 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4 text-emerald-600 font-black animate-in slide-in-from-top-4">
           <CheckCircle2 size={24} /> {successMsg}
        </div>
      )}

      {/* Students Financial List */}
      <div className="grid grid-cols-1 gap-8">
        {students.length > 0 ? (
          students.filter(s => s.name.includes(searchTerm)).map(s => {
            const studentPayments = allPayments.filter(p => p.student_id === s.id);
            const isHistoryOpen = showHistoryId === s.id;
            const isDebt = s.remaining_balance > 0;

            return (
              <div key={s.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl">
                 <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6 w-full lg:w-auto">
                       <div className="w-20 h-20 bg-slate-50 text-indigo-600 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-inner">{s.name[0]}</div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900">{s.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-slate-400 font-bold text-sm">الإجمالي: ${s.total_paid + s.remaining_balance}</span>
                             <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                             <span className="text-emerald-500 font-bold text-sm">المسدد: ${s.total_paid}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-center">
                       <div className={`px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 border ${!isDebt ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {!isDebt ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          {!isDebt ? 'خالص بالكامل' : `المتبقي: $${s.remaining_balance}`}
                       </div>
                       
                       <button onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1">
                          تسجيل دفعة
                       </button>
                       
                       <button onClick={() => setShowHistoryId(isHistoryOpen ? null : s.id)} className={`p-4 rounded-2xl transition-all ${isHistoryOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                          {isHistoryOpen ? <FolderOpen size={24} /> : <Folder size={24} />}
                       </button>
                    </div>
                 </div>

                 {isHistoryOpen && (
                   <div className="mt-10 pt-10 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-8">
                         <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">تاريخ الدفعات المسجلة لهذا الطالب</h4>
                         <span className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black text-slate-500">{studentPayments.length} دفعات</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {studentPayments.length > 0 ? studentPayments.map(p => (
                           <div key={p.id} className="p-6 bg-slate-50 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-50"><DollarSign size={20} /></div>
                                 <div>
                                    <p className="font-black text-slate-900">${p.amount} <span className="text-[10px] text-slate-400 font-bold mr-2">({p.payment_method})</span></p>
                                    <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-tighter">{p.payment_date} • {p.payment_number}</p>
                                 </div>
                              </div>
                              <button onClick={() => setConfirmDeleteId(p.id)} className="p-3 bg-white text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-sm">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                         )) : (
                            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                               <p className="text-slate-300 font-black italic">لا يوجد سجل دفعات لهذا الطالب حتى الآن.</p>
                            </div>
                         )}
                      </div>
                   </div>
                 )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
             <Wallet size={60} className="mx-auto text-slate-100 mb-6" />
             <h3 className="text-2xl font-black text-slate-400">لا يوجد طلاب مسجلون في هذا الفصل</h3>
             <p className="text-slate-300 font-bold mt-2">عند إضافة طلاب في صفحة "طلابي"، سيظهرون هنا لمتابعة حساباتهم.</p>
          </div>
        )}
      </div>

      {/* Confirmation Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto">
                 <AlertTriangle size={40} />
              </div>
              <div className="text-center">
                 <h3 className="text-2xl font-black mb-2">تأكيد حذف الدفعة؟</h3>
                 <p className="text-slate-500 font-bold">سيؤدي هذا لتعديل الميزانية والمبلغ المتبقي على الطالب تلقائياً وبشكل فوري.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">تراجع</button>
                 <button onClick={() => handleDeletePayment(confirmDeleteId)} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg">حذف نهائي</button>
              </div>
           </div>
        </div>
      )}

      {/* New Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
          <form onSubmit={handleSavePayment} className="bg-white p-12 rounded-[4rem] w-full max-w-md space-y-8 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900">تسجيل مبلغ لـ {selectedStudent?.name}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <label className="text-sm font-black text-slate-500">المبلغ المستلم</label>
                    <div className="relative">
                       <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input required type="number" step="0.5" className="w-full pr-12 pl-4 py-5 bg-slate-50 rounded-2xl font-bold outline-none ring-indigo-100 focus:ring-2" placeholder="0.0" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-sm font-black text-slate-500">تاريخ الدفعة</label>
                    <input required type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-2 text-right">
                 <label className="text-sm font-black text-slate-500">طريقة الاستلام</label>
                 <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                    <option value="كاش">كاش (نقدي)</option>
                    <option value="كي نت">كي نت (رابط دفع)</option>
                    <option value="ومض">ومض (تحويل بنكي)</option>
                 </select>
               </div>

               <div className="flex items-center gap-4 bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-amber-600" id="is_final" checked={paymentForm.is_final} onChange={e => setPaymentForm({...paymentForm, is_final: e.target.checked})} />
                  <label htmlFor="is_final" className="text-sm font-black text-amber-800 cursor-pointer select-none">اعتبارها دفعة نهائية (تسوية الحساب)</label>
               </div>

               <div className="space-y-2 text-right">
                  <label className="text-sm font-black text-slate-500">ملاحظات (اختياري)</label>
                  <textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-24 outline-none" placeholder="اكتب أي ملاحظات هنا..." value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
               </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
               {loading ? <RefreshCw className="animate-spin" /> : null} حفظ الدفعة المالية
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Payments;
