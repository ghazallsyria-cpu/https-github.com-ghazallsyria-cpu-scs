
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, Trash2, Search, RefreshCw, 
  ArrowUpRight, ArrowDownRight, TrendingUp, History, Filter, CheckCircle, AlertCircle, CreditCard, ChevronLeft
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
      let qStds = supabase.from('student_summary_view').select('*');
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds.order('name');
      setStudents(stds || []);

      let qPays = supabase.from('payments').select('*, students(name)');
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      const { data: pays } = await qPays.order('payment_date', { ascending: false });
      setAllPayments(pays || []);
    } catch (err) {
      console.error(err);
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
        teacher_id: selectedStudent.teacher_id
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', payment_method: 'كاش' });
      fetchFinancialData();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-32 animate-diamond">
      {/* Dynamic Summary Panel */}
      <div className="bg-slate-900 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
         <div className="relative z-10 flex items-center gap-8">
            <div className="bg-indigo-500 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-500/20"><Wallet size={40} /></div>
            <div>
               <h2 className="text-3xl md:text-5xl font-black mb-2">المركز المالي</h2>
               <p className="text-slate-400 font-bold text-lg">تحكم كامل في التدفق النقدي والديون.</p>
            </div>
         </div>
         
         <div className="relative z-10 flex gap-4 md:gap-8">
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المحصل</p>
               <h4 className="text-3xl font-black text-emerald-400">${stats.totalCollected.toLocaleString()}</h4>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المطلوب</p>
               <h4 className="text-3xl font-black text-rose-400">${stats.totalDebt.toLocaleString()}</h4>
            </div>
         </div>
         {/* Background glow */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
         <div className="flex bg-white p-2 rounded-[2.5rem] diamond-shadow border border-slate-100 w-full lg:w-auto">
            <button onClick={() => setViewMode('students')} className={`flex-1 lg:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${viewMode === 'students' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>ديون الطلاب</button>
            <button onClick={() => setViewMode('history')} className={`flex-1 lg:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>سجل الدفعات</button>
         </div>
         
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input placeholder="بحث عن طالب..." className="w-full pr-14 pl-6 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {viewMode === 'students' && (
               <div className="flex gap-2">
                  <FilterIcon active={filterType === 'all'} onClick={() => setFilterType('all')} icon={<History size={18}/>} />
                  <FilterIcon active={filterType === 'debt'} onClick={() => setFilterType('debt')} icon={<AlertCircle size={18}/>} color="rose" />
                  <FilterIcon active={filterType === 'cleared'} onClick={() => setFilterType('cleared')} icon={<CheckCircle size={18}/>} color="emerald" />
               </div>
            )}
         </div>
      </div>

      {viewMode === 'students' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredStudents.length > 0 ? filteredStudents.map(s => {
             const progress = Math.min(100, (s.total_paid / s.expected_total) * 100) || 0;
             return (
              <div key={s.id} className="platinum-card p-10 border border-slate-50 shadow-sm relative group overflow-hidden">
                 <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">{s.name[0]}</div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                       <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{s.group_name || 'طلاب فردي'}</span>
                    </div>
                 </div>

                 <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-xs font-black">
                       <span className="text-slate-400">الالتزام المالي</span>
                       <span className={progress === 100 ? 'text-emerald-500' : 'text-indigo-600'}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${progress}%`}}></div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-3xl text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المسدد</p>
                       <p className="text-lg font-black text-emerald-600">${s.total_paid}</p>
                    </div>
                    <div className={`p-4 rounded-3xl text-center border-2 ${s.remaining_balance > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                       <p className="text-[10px] font-black opacity-60 uppercase mb-1">المتبقي</p>
                       <p className="text-lg font-black">${s.remaining_balance}</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                 >
                    <CreditCard size={18} /> تحصيل دفعة
                 </button>
              </div>
             );
           }) : (
              <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                 <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6"><Search size={40}/></div>
                 <p className="text-slate-400 font-black">لا توجد نتائج تطابق بحثك المالي.</p>
              </div>
           )}
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border border-slate-100 diamond-shadow overflow-hidden">
           <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black flex items-center gap-4"><History className="text-indigo-600" /> كشف المعاملات</h3>
              <button onClick={fetchFinancialData} className="p-4 bg-slate-50 rounded-2xl hover:text-indigo-600 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
           </div>
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right min-w-[700px]">
                 <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                       <th className="px-10 py-6">المستفيد</th>
                       <th className="px-10 py-6">المبلغ</th>
                       <th className="px-10 py-6">التاريخ</th>
                       <th className="px-10 py-6">طريقة الدفع</th>
                       <th className="px-10 py-6 text-center">أدوات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allPayments.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-10 py-7 font-black text-slate-900">{p.students?.name}</td>
                          <td className="px-10 py-7 font-black text-emerald-600">${p.amount}</td>
                          <td className="px-10 py-7 font-bold text-slate-400 text-xs">{p.payment_date}</td>
                          <td className="px-10 py-7"><span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">{p.payment_method}</span></td>
                          <td className="px-10 py-7 text-center">
                             <button onClick={async () => {
                                if (confirm("حذف العملية؟")) {
                                   await supabase.from('payments').delete().eq('id', p.id);
                                   fetchFinancialData();
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

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
           <form onSubmit={handleSavePayment} className="bg-white p-12 rounded-[4rem] w-full max-w-md shadow-2xl space-y-8 animate-in zoom-in text-right">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900">تحصيل دفعة</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">للطالب: {selectedStudent?.name}</p>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">القيمة المالية ($)</label>
                    <div className="relative">
                       <DollarSign className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500" size={24} />
                       <input required type="number" step="0.5" placeholder="0.00" className="w-full pr-16 pl-6 py-6 bg-slate-50 rounded-[2rem] font-black border-none focus:ring-4 ring-emerald-50 outline-none text-2xl" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500">التاريخ</label>
                       <input type="date" className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-black border-none text-xs" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500">الوسيلة</label>
                       <select className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-black border-none text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                          <option value="كاش">كاش</option><option value="كي نت">رابط بنكي</option><option value="تحويل">تحويل</option>
                       </select>
                    </div>
                 </div>
              </div>

              <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95">
                 {loading ? <RefreshCw className="animate-spin" /> : <DollarSign size={24} />} تأكيد التحصيل
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

const FilterIcon = ({ active, onClick, icon, color = 'indigo' }: any) => {
   const activeStyles: any = {
      indigo: 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100',
      rose: 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100',
      emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'
   };
   return (
      <button onClick={onClick} className={`p-5 rounded-[1.5rem] transition-all border ${active ? activeStyles[color] : 'bg-white text-slate-400 border-slate-100'}`}>
         {icon}
      </button>
   );
};

export default Payments;
