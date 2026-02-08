
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, Trash2, Search, RefreshCw, 
  ArrowUpRight, ArrowDownRight, TrendingUp, History, Filter, CheckCircle, AlertCircle
} from 'lucide-react';

const Payments = ({ role, uid, isAdmin: propsIsAdmin }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'cleared'>('all');
  const [viewMode, setViewMode] = useState<'students' | 'history'>('students');

  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    payment_date: new Date().toISOString().split('T')[0], 
    notes: '',
    payment_method: 'كاش'
  });

  const isAdmin = role === 'admin' || propsIsAdmin;

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      // جلب ملخص الطلاب المالي من الـ View الذكي
      let qStds = supabase.from('student_summary_view').select('*');
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds, error: stdError } = await qStds.order('name');
      if (stdError) throw stdError;
      setStudents(stds || []);

      // جلب سجل المعاملات المالية
      let qPays = supabase.from('payments').select('*, students(name)');
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      const { data: pays, error: payError } = await qPays.order('payment_date', { ascending: false });
      if (payError) throw payError;
      setAllPayments(pays || []);
    } catch (err) {
      console.error("Financial Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [uid, isAdmin]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const stats = useMemo(() => {
    const totalExpected = students.reduce((acc, s) => acc + Number(s.expected_total || 0), 0);
    const totalCollected = students.reduce((acc, s) => acc + Number(s.total_paid || 0), 0);
    const totalDebt = students.reduce((acc, s) => acc + Math.max(0, Number(s.remaining_balance || 0)), 0);
    return { totalExpected, totalCollected, totalDebt };
  }, [students]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.includes(searchTerm);
    if (filterType === 'debt') return matchesSearch && s.remaining_balance > 0;
    if (filterType === 'cleared') return matchesSearch && s.remaining_balance <= 0;
    return matchesSearch;
  });

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !paymentForm.amount) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('payments').insert([{
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
        student_id: selectedStudent.id,
        teacher_id: selectedStudent.teacher_id // نستخدم ID المعلم الخاص بالطالب
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', payment_method: 'كاش' });
      fetchFinancialData();
    } catch (err: any) {
      alert("خطأ في تسجيل الدفعة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700">
      {/* Financial Top Bar */}
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Wallet size={32} /></div>
            <div>
               <h2 className="text-3xl font-black">المركز <span className="text-indigo-600">المالي</span></h2>
               <p className="text-slate-400 font-bold text-sm">الإدارة الماسية للتدفقات النقدية والتحصيل.</p>
            </div>
         </div>
         <div className="flex bg-slate-100 p-2 rounded-3xl gap-2 w-full lg:w-auto">
            <button onClick={() => setViewMode('students')} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-2xl font-black text-sm transition-all ${viewMode === 'students' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>الطلاب والديون</button>
            <button onClick={() => setViewMode('history')} className={`flex-1 lg:flex-none px-8 py-3.5 rounded-2xl font-black text-sm transition-all ${viewMode === 'history' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>سجل المعاملات</button>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <SummaryBox label="إجمالي القيمة المتوقعة" value={`$${stats.totalExpected.toLocaleString()}`} icon={<TrendingUp />} color="indigo" />
         <SummaryBox label="المبالغ المحصلة فعلياً" value={`$${stats.totalCollected.toLocaleString()}`} icon={<ArrowDownRight />} color="emerald" />
         <SummaryBox label="إجمالي الديون المتأخرة" value={`$${stats.totalDebt.toLocaleString()}`} icon={<ArrowUpRight />} color="rose" />
      </div>

      {viewMode === 'students' ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="relative w-full md:w-96">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input placeholder="بحث عن طالب..." className="w-full pr-12 pl-6 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-2">
                <FilterBtn active={filterType === 'all'} label="الكل" onClick={() => setFilterType('all')} />
                <FilterBtn active={filterType === 'debt'} label="مديونون" onClick={() => setFilterType('debt')} color="rose" />
                <FilterBtn active={filterType === 'cleared'} label="خالصون" onClick={() => setFilterType('cleared')} color="emerald" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {filteredStudents.length > 0 ? filteredStudents.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">{s.name[0]}</div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 leading-tight">{s.name}</h3>
                         <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full">{s.group_name || 'طلاب فردي'}</span>
                      </div>
                   </div>

                   <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-xs font-black">
                         <span className="text-slate-400">القيمة الإجمالية</span>
                         <span className="text-slate-900">${s.expected_total}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black">
                         <span className="text-slate-400">المبلغ المدفوع</span>
                         <span className="text-emerald-500">${s.total_paid}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${Math.min(100, (s.total_paid / s.expected_total) * 100) || 0}%`}}></div>
                      </div>
                   </div>

                   <div className={`p-6 rounded-[2rem] flex justify-between items-center mb-8 ${s.remaining_balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <div className="flex items-center gap-2">
                         {s.remaining_balance > 0 ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                         <span className="text-xs font-black">{s.remaining_balance > 0 ? 'المتبقي' : 'تم السداد'}</span>
                      </div>
                      <span className="text-2xl font-black">${s.remaining_balance}</span>
                   </div>

                   <button 
                    onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                   >
                      <Plus size={20} /> تسجيل دفعة
                   </button>
                </div>
             )) : (
                <div className="col-span-full py-20 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                   <Search size={48} className="mx-auto text-slate-100 mb-4" />
                   <p className="text-slate-400 font-black">لا يوجد نتائج تطابق بحثك المالي.</p>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3.5rem] border shadow-sm overflow-hidden animate-in slide-in-from-bottom-8">
           <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black flex items-center gap-4"><History className="text-indigo-600" /> كشف المعاملات الرقمي</h3>
              <button onClick={fetchFinancialData} className="p-4 bg-slate-50 rounded-2xl hover:text-indigo-600 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                       <th className="px-10 py-6">الطالب المستفيد</th>
                       <th className="px-10 py-6">المبلغ المحصل</th>
                       <th className="px-10 py-6">التاريخ والزمن</th>
                       <th className="px-10 py-6">الوسيلة</th>
                       <th className="px-10 py-6 text-center">أدوات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allPayments.map(p => (
                       <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-10 py-6">
                             <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{p.students?.name}</span>
                          </td>
                          <td className="px-10 py-6"><span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black">${p.amount}</span></td>
                          <td className="px-10 py-6 font-bold text-slate-400 text-xs">{p.payment_date}</td>
                          <td className="px-10 py-6"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">{p.payment_method}</span></td>
                          <td className="px-10 py-6 text-center">
                             <button onClick={async () => {
                                if (confirm("هل تريد حذف هذه العملية المالية؟")) {
                                   const { error } = await supabase.from('payments').delete().eq('id', p.id);
                                   if (!error) fetchFinancialData();
                                }
                             }} className="p-3 text-rose-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Modal - تسجيل الدفعة */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xl">
           <form onSubmit={handleSavePayment} className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-2xl space-y-8 animate-in zoom-in text-right border border-white/20">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                 <div>
                    <h3 className="text-2xl font-black">تحصيل دفعة مالية</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">الطالب: {selectedStudent?.name}</p>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">القيمة المستلمة بالدولار</label>
                    <div className="relative">
                       <DollarSign className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                       <input required type="number" step="0.5" className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-3xl font-black border-none focus:ring-4 ring-emerald-50 outline-none text-xl" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500">تاريخ الاستلام</label>
                       <input type="date" className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none text-xs" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500">وسيلة الدفع</label>
                       <select className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                          <option value="كاش">كاش</option><option value="كي نت">رابط بنكي</option><option value="تحويل">تحويل</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">ملاحظات العملية</label>
                    <textarea placeholder="أي ملاحظات إضافية..." className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none h-28 focus:ring-4 ring-indigo-50 outline-none" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
                 </div>
              </div>
              <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95">
                 {loading ? <RefreshCw className="animate-spin" /> : <DollarSign size={24} />} تأكيد استلام المبلغ
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

const SummaryBox = ({ label, value, icon, color }: any) => {
   const themes: any = {
      indigo: 'bg-indigo-600 text-white',
      emerald: 'bg-white border-emerald-100 text-emerald-600 shadow-sm',
      rose: 'bg-white border-rose-100 text-rose-600 shadow-sm'
   };
   return (
      <div className={`p-8 rounded-[3.5rem] border flex items-center justify-between group hover:-translate-y-1 transition-all ${themes[color]}`}>
         <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${color === 'indigo' ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</p>
            <h4 className="text-3xl font-black">{value}</h4>
         </div>
         <div className={`p-5 rounded-2xl ${color === 'indigo' ? 'bg-white/10' : (color === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50')}`}>
            {React.cloneElement(icon, { size: 28 })}
         </div>
      </div>
   );
};

const FilterBtn = ({ active, label, onClick, color = 'indigo' }: any) => {
   const activeStyles: any = {
      indigo: 'bg-indigo-600 text-white border-indigo-600 shadow-lg',
      emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-lg',
      rose: 'bg-rose-600 text-white border-rose-600 shadow-lg'
   };
   return (
      <button onClick={onClick} className={`px-8 py-4 rounded-full font-black text-xs transition-all border ${active ? activeStyles[color] : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>{label}</button>
   );
};

export default Payments;
