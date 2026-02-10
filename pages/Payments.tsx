
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, Trash2, Search, RefreshCw, 
  ArrowUpRight, ArrowDownRight, TrendingUp, History, Filter, CheckCircle, AlertCircle, CreditCard, ChevronLeft, Calendar
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    } catch (err: any) { alert("خطأ: " + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Wealth Meter Dashboard */}
      <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-12">
         <div className="relative z-10 flex items-center gap-10">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 rotate-6 group hover:rotate-0 transition-transform duration-700"><Wallet size={50} /></div>
            <div>
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">المركز المالي</h2>
               <p className="text-slate-400 font-bold text-xl max-w-md leading-relaxed">إدارة دقيقة للسيولة النقدية وتتبع مديونية الطلاب بنظام ذكي.</p>
            </div>
         </div>
         
         <div className="relative z-10 grid grid-cols-2 gap-10">
            <div className="text-center">
               <div className="inline-flex items-center gap-2 text-emerald-400 mb-2"><TrendingUp size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">المحصل فعلياً</span></div>
               <h4 className="text-5xl font-black text-white">${stats.totalCollected.toLocaleString()}</h4>
            </div>
            <div className="text-center">
               <div className="inline-flex items-center gap-2 text-rose-400 mb-2"><AlertCircle size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">المتبقي خارجي</span></div>
               <h4 className="text-5xl font-black text-white">${stats.totalDebt.toLocaleString()}</h4>
            </div>
         </div>
         {/* Decorative Gradients */}
         <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
         <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-50 w-full lg:w-auto">
            <button onClick={() => setViewMode('students')} className={`flex-1 lg:flex-none px-12 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 ${viewMode === 'students' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>حسابات الطلاب</button>
            <button onClick={() => setViewMode('history')} className={`flex-1 lg:flex-none px-12 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>سجل المعاملات</button>
         </div>
         
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
               <input placeholder="بحث مالي سريع..." className="w-full pr-16 pl-6 py-5 bg-white border border-slate-100 rounded-[2.5rem] font-bold focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {viewMode === 'students' && (
               <div className="flex gap-2">
                  <FinancialFilter active={filterType === 'all'} onClick={() => setFilterType('all')} icon={<History size={20}/>} />
                  <FinancialFilter active={filterType === 'debt'} onClick={() => setFilterType('debt')} icon={<AlertCircle size={20}/>} color="rose" />
                  <FinancialFilter active={filterType === 'cleared'} onClick={() => setFilterType('cleared')} icon={<CheckCircle size={20}/>} color="emerald" />
               </div>
            )}
         </div>
      </div>

      {viewMode === 'students' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filteredStudents.length > 0 ? filteredStudents.map(s => {
             const progress = Math.min(100, (s.total_paid / s.expected_total) * 100) || 0;
             return (
              <div key={s.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative group overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                 <div className="flex items-center gap-6 mb-10">
                    <div className="w-18 h-18 bg-slate-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700">{s.name[0]}</div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{s.name}</h3>
                       <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1 rounded-full uppercase tracking-tighter">{s.group_name || 'طلاب فردي'}</span>
                    </div>
                 </div>

                 {/* Commitment Meter */}
                 <div className="space-y-4 mb-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">نسبة السداد</span>
                       <span className={progress === 100 ? 'text-emerald-500' : 'text-indigo-600'}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div className={`h-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]'}`} style={{width: `${progress}%`}}></div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-5 mb-10">
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] text-center border border-white">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المحـصل</p>
                       <p className="text-2xl font-black text-emerald-600">${s.total_paid}</p>
                    </div>
                    <div className={`p-6 rounded-[2.5rem] text-center border-2 ${s.remaining_balance > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100'} shadow-xl`}>
                       <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">المتبقي</p>
                       <p className="text-2xl font-black">${s.remaining_balance}</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                 >
                    <CreditCard size={20} /> تسجيل دفعة مالية
                 </button>
              </div>
             );
           }) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[5rem] border-2 border-dashed border-slate-100">
                 <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"><Search size={48}/></div>
                 <p className="text-slate-400 font-black text-xl">لا توجد سجلات مالية متوفرة لهذا البحث.</p>
              </div>
           )}
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
           <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-3xl font-black flex items-center gap-6 text-slate-900"><History className="text-indigo-600" /> كشف المعاملات البلاتيني</h3>
              <button onClick={fetchFinancialData} className="p-5 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
           </div>
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right min-w-[900px]">
                 <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                       <th className="px-12 py-8">المستفيد الدراسي</th>
                       <th className="px-12 py-8">المبلغ المحصل</th>
                       <th className="px-12 py-8">تاريخ المعاملة</th>
                       <th className="px-12 py-8">وسيلة السداد</th>
                       <th className="px-12 py-8 text-center">الإجراء</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allPayments.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-12 py-8">
                             <span className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{p.students?.name}</span>
                          </td>
                          <td className="px-12 py-8 font-black text-emerald-600 text-xl">${p.amount}</td>
                          <td className="px-12 py-8">
                             <div className="flex items-center gap-2 text-slate-400 font-bold text-sm"><Calendar size={14}/> {p.payment_date}</div>
                          </td>
                          <td className="px-12 py-8"><span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100">{p.payment_method}</span></td>
                          <td className="px-12 py-8 text-center">
                             <button onClick={async () => {
                                if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
                                   await supabase.from('payments').delete().eq('id', p.id);
                                   fetchFinancialData();
                                }
                             }} className="p-4 text-rose-300 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"><Trash2 size={20} /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Advanced Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-8 bg-slate-900/70 backdrop-blur-3xl">
           <form onSubmit={handleSavePayment} className="bg-white p-14 rounded-[5rem] w-full max-w-xl shadow-2xl space-y-10 animate-in zoom-in duration-500 text-right">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900">تحصيل دفعة مالية</h3>
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-2">إيداع لحساب الطالب: {selectedStudent?.name}</p>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">القيمة المالية ($)</label>
                    <div className="relative">
                       <DollarSign className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 p-1.5 rounded-xl" size={32} />
                       <input required type="number" step="0.5" placeholder="0.00" className="w-full pr-20 pl-8 py-8 bg-slate-50 rounded-[2.5rem] font-black border-none focus:ring-4 ring-emerald-50 outline-none text-4xl shadow-inner" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">تاريخ الاستلام</label>
                       <input type="date" className="w-full p-6 bg-slate-50 rounded-[2rem] font-black border-none text-sm" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">طريقة الدفع</label>
                       <select className="w-full p-6 bg-slate-50 rounded-[2rem] font-black border-none text-sm appearance-none" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                          <option value="كاش">كاش (نقدي)</option><option value="كي نت">رابط بنكي</option><option value="تحويل">تحويل بنكي</option>
                       </select>
                    </div>
                 </div>
              </div>

              <button disabled={loading} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all active:scale-95">
                 {loading ? <RefreshCw className="animate-spin" /> : <DollarSign size={28} />} تأكيد العملية المالية
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

const FinancialFilter = ({ active, onClick, icon, color = 'indigo' }: any) => {
   const styles: any = {
      indigo: 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100',
      rose: 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-100',
      emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100'
   };
   return (
      <button onClick={onClick} className={`p-6 rounded-[2rem] transition-all duration-500 border ${active ? styles[color] : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>
         {icon}
      </button>
   );
};

export default Payments;
