
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, CheckCircle, AlertCircle, Trash2, 
  Search, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, TrendingUp, History, ListFilter
} from 'lucide-react';

const Payments = ({ role, uid, year, semester }: any) => {
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

  const isAdmin = role === 'admin';

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      let qStds = supabase.from('student_summary_view').select('*');
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds.order('name');
      setStudents(stds || []);

      if (stds && stds.length > 0) {
        let qPays = supabase.from('payments').select('*, students(name)');
        if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
        const { data: pays } = await qPays.order('payment_date', { ascending: false });
        setAllPayments(pays || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, isAdmin]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const financialStats = useMemo(() => {
    const totalExpected = students.reduce((acc, s) => acc + Number(s.expected_total || 0), 0);
    const totalCollected = students.reduce((acc, s) => acc + Number(s.total_paid || 0), 0);
    const totalOutstanding = students.reduce((acc, s) => acc + Number(s.remaining_balance || 0), 0);
    return { totalExpected, totalCollected, totalOutstanding };
  }, [students]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.includes(searchTerm);
    if (filterType === 'debt') return matchesSearch && s.remaining_balance > 0;
    if (filterType === 'cleared') return matchesSearch && s.remaining_balance <= 0;
    return matchesSearch;
  });

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('payments').insert([{
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
        student_id: selectedStudent.id,
        teacher_id: uid
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      fetchFinancialData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Header & Stats Container */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg"><Wallet size={28} /></div>
              <div>
                 <h2 className="text-2xl font-black">المركز <span className="text-indigo-600">المالي</span></h2>
                 <p className="text-slate-400 font-bold text-xs">إدارة التدفقات المالية للطلاب.</p>
              </div>
           </div>
           <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setViewMode('students')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${viewMode === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>قائمة الطلاب</button>
              <button onClick={() => setViewMode('history')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${viewMode === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>سجل الدفعات</button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">المبلغ الكلي</p><h4 className="text-2xl font-black text-slate-900">${financialStats.totalExpected.toLocaleString()}</h4></div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={24} /></div>
           </div>
           <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">المحصل</p><h4 className="text-2xl font-black text-emerald-600">${financialStats.totalCollected.toLocaleString()}</h4></div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ArrowDownRight size={24} /></div>
           </div>
           <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between">
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">المتبقي (ديون)</p><h4 className="text-2xl font-black text-rose-600">${financialStats.totalOutstanding.toLocaleString()}</h4></div>
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><ArrowUpRight size={24} /></div>
           </div>
        </div>
      </div>

      {viewMode === 'students' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="relative w-full md:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input placeholder="بحث باسم الطالب..." className="w-full pr-10 pl-4 py-4 bg-white border border-slate-100 rounded-2xl font-bold focus:ring-2 ring-indigo-50 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setFilterType('all')} className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-xs border ${filterType === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>الكل</button>
                <button onClick={() => setFilterType('debt')} className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-xs border ${filterType === 'debt' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>المطلوب</button>
                <button onClick={() => setFilterType('cleared')} className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-xs border ${filterType === 'cleared' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>الخالص</button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredStudents.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all group">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">{s.name[0]}</div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900">{s.name}</h3>
                         <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{s.grade}</span>
                      </div>
                   </div>

                   <div className="space-y-3 mb-8">
                      <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400 font-bold">الإجمالي المتوقع:</span>
                         <span className="font-black text-slate-900">${s.expected_total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400 font-bold">المبلغ المسدد:</span>
                         <span className="font-black text-emerald-600">${s.total_paid}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${Math.min(100, (s.total_paid / s.expected_total) * 100) || 0}%`}}></div>
                      </div>
                      <div className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl mt-4">
                         <span className="text-rose-600 text-xs font-black">المتبقي:</span>
                         <span className="font-black text-rose-600 text-lg">${s.remaining_balance}</span>
                      </div>
                   </div>

                   <button 
                    onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"
                   >
                      <Plus size={18} /> تسجيل دفعة جديدة
                   </button>
                </div>
             ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden animate-in slide-in-from-bottom-8">
           <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><History className="text-indigo-600" /> آخر الدفعات المستلمة</h3>
              <button onClick={fetchFinancialData} className="p-3 bg-slate-50 rounded-xl hover:text-indigo-600 transition-all"><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                    <tr>
                       <th className="px-8 py-4">الطالب</th>
                       <th className="px-8 py-4">المبلغ</th>
                       <th className="px-8 py-4">التاريخ</th>
                       <th className="px-8 py-4">الوسيلة</th>
                       <th className="px-8 py-4 text-center">أدوات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allPayments.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 font-black text-slate-900">{p.students?.name}</td>
                          <td className="px-8 py-5 font-black text-emerald-600">${p.amount}</td>
                          <td className="px-8 py-5 font-bold text-slate-400 text-xs">{p.payment_date}</td>
                          <td className="px-8 py-5"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">{p.payment_method}</span></td>
                          <td className="px-8 py-5 text-center">
                             <button onClick={async () => {
                                if (confirm("حذف هذه الدفعة؟")) {
                                   await supabase.from('payments').delete().eq('id', p.id);
                                   fetchFinancialData();
                                }
                             }} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
           <form onSubmit={handleSavePayment} className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in text-right">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black">تحصيل مبلغ لـ {selectedStudent?.name}</h3>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full hover:text-rose-500"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">المبلغ المستلم ($)</label>
                    <input required type="number" step="0.5" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-xs font-black text-slate-500">التاريخ</label>
                       <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-black text-slate-500">طريقة الدفع</label>
                       <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                          <option value="كاش">كاش</option><option value="كي نت">رابط بنكي</option><option value="تحويل">تحويل</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">ملاحظات</label>
                    <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none h-24" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
                 </div>
              </div>
              <button disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                 <DollarSign size={20} /> تأكيد تحصيل المبلغ
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Payments;
