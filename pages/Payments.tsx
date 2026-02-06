
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Wallet, Plus, X, DollarSign, CheckCircle, AlertCircle, Trash2, Search, Edit3, Save, RefreshCw, Folder, FolderOpen, AlertTriangle, Calendar } from 'lucide-react';

const Payments = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      let qStds = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds;

      const studentIds = stds?.map(s => s.id) || [];
      let qPays = supabase.from('payments').select('*, students(name)').in('student_id', studentIds);
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      const { data: pays } = await qPays;
      
      setAllPayments(pays || []);
      setStudents(stds || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentForm.is_final) {
        if (!confirm("هل أنت متأكد من وسم هذه الدفعة كدفعة نهائية؟ سيتم اعتبار الطالب قد سدد كامل المبلغ.")) return;
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
      await supabase.from('payments').insert([payload]);
      setIsModalOpen(false); 
      setPaymentForm({ ...paymentForm, amount: '', notes: '', is_final: false });
      fetchFinancialData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDeletePayment = async (id: string) => {
    await supabase.from('payments').delete().eq('id', id);
    setConfirmDeleteId(null);
    fetchFinancialData();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl"><Wallet size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">المركز <span className="text-indigo-600">المالي</span></h2>
            <p className="text-slate-400 font-bold">تتبع الدفعات والمستحقات بدقة عالية.</p>
          </div>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input placeholder="بحث باسم الطالب..." className="w-full pr-12 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {students.filter(s => s.name.includes(searchTerm)).map(s => {
          const studentPayments = allPayments.filter(p => p.student_id === s.id);
          const isHistoryOpen = showHistoryId === s.id;

          return (
            <div key={s.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-lg">
               <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-2xl shadow-inner">{s.name[0]}</div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-900">{s.name}</h3>
                        <p className="text-slate-400 font-bold text-sm">الإجمالي: ${s.total_paid + s.remaining_balance} | المسدد: ${s.total_paid}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className={`px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 border ${s.remaining_balance <= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {s.remaining_balance <= 0 ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {s.remaining_balance <= 0 ? 'خالص بالكامل' : `المتبقي: $${s.remaining_balance}`}
                     </div>
                     <button onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-indigo-600 transition-all shadow-xl">تسجيل دفعة</button>
                     <button onClick={() => setShowHistoryId(isHistoryOpen ? null : s.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                        {isHistoryOpen ? <FolderOpen size={20} /> : <Folder size={20} />}
                     </button>
                  </div>
               </div>

               {isHistoryOpen && (
                 <div className="mt-8 pt-8 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">تاريخ الدفعات المسجلة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {studentPayments.length > 0 ? studentPayments.map(p => (
                         <div key={p.id} className="p-6 bg-slate-50 rounded-3xl flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><DollarSign size={20} /></div>
                               <div>
                                  <p className="font-black text-slate-900">${p.amount} ({p.payment_method})</p>
                                  <p className="text-xs text-slate-400 font-bold">{p.payment_date} - {p.payment_number}</p>
                               </div>
                            </div>
                            <button onClick={() => setConfirmDeleteId(p.id)} className="p-3 bg-white text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white">
                               <Trash2 size={16} />
                            </button>
                         </div>
                       )) : <p className="col-span-full py-10 text-center text-slate-300 font-black italic">لا يوجد سجل دفعات حالياً.</p>}
                    </div>
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Delete Payment */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto">
                 <AlertTriangle size={40} />
              </div>
              <div className="text-center">
                 <h3 className="text-2xl font-black mb-2">تأكيد حذف الدفعة؟</h3>
                 <p className="text-slate-500 font-bold">سيؤدي هذا لتعديل الميزانية والمبلغ المتبقي على الطالب تلقائياً.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">تراجع</button>
                 <button onClick={() => handleDeletePayment(confirmDeleteId)} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg">حذف الدفعة</button>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
          <form onSubmit={handleSavePayment} className="bg-white p-12 rounded-[4rem] w-full max-w-md space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">تسجيل مبلغ لـ {selectedStudent?.name}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black">المبلغ</label>
                    <div className="relative">
                       <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input required type="number" className="w-full pr-12 pl-4 py-5 bg-slate-50 rounded-2xl font-bold outline-none ring-indigo-100 focus:ring-2" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black">التاريخ</label>
                    <input required type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-black">طريقة الدفع</label>
                 <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                    <option value="كاش">كاش (نقدي)</option>
                    <option value="كي نت">كي نت (رابط)</option>
                    <option value="ومض">ومض (تحويل)</option>
                 </select>
               </div>

               <div className="flex items-center gap-4 bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-amber-500" id="is_final" checked={paymentForm.is_final} onChange={e => setPaymentForm({...paymentForm, is_final: e.target.checked})} />
                  <label htmlFor="is_final" className="text-sm font-black text-amber-700 cursor-pointer select-none">اعتبارها دفعة نهائية (خالص)</label>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-black">ملاحظات</label>
                  <textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-24 outline-none" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
               </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">
               {loading ? 'جاري الحفظ...' : 'حفظ الدفعة'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Payments;
