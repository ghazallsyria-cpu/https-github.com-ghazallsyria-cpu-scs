
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, Trash2, Search, RefreshCw, 
  History, CheckCircle, AlertCircle, CreditCard, Calendar
} from 'lucide-react';

const Payments = ({ role, uid, isAdmin: propsIsAdmin, year, semester }: any) => {
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
      // جلب كافة الطلاب للمعلم
      let qStds = supabase.from('student_summary_view').select('*');
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds.order('name');
      
      // تصفية ذكية: عرض طلاب الفصل الحالي + الطلاب الذين لم يتم تعيين فصل لهم بعد
      const filteredStds = (stds || []).filter(s => 
        (s.academic_year === year && s.semester === semester) || (!s.academic_year)
      );
      setStudents(filteredStds);

      let qPays = supabase.from('payments').select('*, students!inner(name, academic_year, semester)');
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      
      const { data: pays } = await qPays.order('payment_date', { ascending: false });
      
      // تصفية سجل المعاملات أيضاً بناءً على السنة أو عرض الكل إذا لم يتوفر تصنيف
      const filteredPays = (pays || []).filter((p: any) => 
        (p.students?.academic_year === year && p.students?.semester === semester) || (!p.students?.academic_year)
      );
      setAllPayments(filteredPays);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const stats = useMemo(() => {
    const totalCollected = students.reduce((acc, s) => acc + Number(s.total_paid || 0), 0);
    const totalDebt = students.reduce((acc, s) => acc + Math.max(0, Number(s.remaining_balance || 0)), 0);
    return { totalCollected, totalDebt };
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
    <div className="space-y-12 animate-diamond">
      {/* Wealth Meter */}
      <div className="bg-slate-900 p-12 md:p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-12">
         <div className="relative z-10 flex items-center gap-10">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 rotate-6"><Wallet size={48} /></div>
            <div>
               <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-none">المركز المالي الماسي</h2>
               <p className="text-indigo-400 font-black text-lg uppercase tracking-widest">تحليل السيولة: {year}</p>
            </div>
         </div>
         
         <div className="relative z-10 grid grid-cols-2 gap-12">
            <div className="text-center">
               <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block mb-2">إيرادات محصلة</span>
               <h4 className="text-5xl font-black">${stats.totalCollected.toLocaleString()}</h4>
            </div>
            <div className="text-center">
               <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest block mb-2">ديون مستحقة</span>
               <h4 className="text-5xl font-black">${stats.totalDebt.toLocaleString()}</h4>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 blur-[150px] rounded-full"></div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
         <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-50 w-full lg:w-auto">
            <button onClick={() => setViewMode('students')} className={`flex-1 lg:flex-none px-12 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 ${viewMode === 'students' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>تحصيل الديون</button>
            <button onClick={() => setViewMode('history')} className={`flex-1 lg:flex-none px-12 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>سجل الدفعات</button>
         </div>
         
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
               <input placeholder="البحث في الأسماء والديون..." className="w-full pr-16 pl-6 py-5 bg-white border border-slate-100 rounded-[2.5rem] font-bold focus:ring-4 ring-indigo-50 transition-all outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {viewMode === 'students' && (
               <div className="flex gap-2">
                  <button onClick={() => setFilterType('all')} className={`p-6 rounded-[2rem] transition-all border ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`} title="الكل"><History size={20}/></button>
                  <button onClick={() => setFilterType('debt')} className={`p-6 rounded-[2rem] transition-all border ${filterType === 'debt' ? 'bg-rose-600 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`} title="المديونون فقط"><AlertCircle size={20}/></button>
                  <button onClick={() => setFilterType('cleared')} className={`p-6 rounded-[2rem] transition-all border ${filterType === 'cleared' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`} title="المسددون بالكامل"><CheckCircle size={20}/></button>
               </div>
            )}
         </div>
      </div>

      {viewMode === 'students' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filteredStudents.length > 0 ? filteredStudents.map(s => {
             const progress = Math.min(100, (s.total_paid / s.expected_total) * 100) || 0;
             return (
              <div key={s.id} className="bg-white p-10 rounded-[4rem] border shadow-sm relative group overflow-hidden hover:shadow-2xl transition-all duration-500 border-b-8 border-b-transparent hover:border-b-indigo-600">
                 <div className="flex items-center gap-6 mb-10">
                    <div className="w-16 h-16 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                       <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1 truncate">{s.name}</h3>
                       <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase">{s.academic_year || 'سنة غير محددة'}</span>
                    </div>
                 </div>

                 <div className="space-y-4 mb-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">تقدم السداد</span>
                       <span className={progress === 100 ? 'text-emerald-500' : 'text-indigo-600'}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${progress}%`}}></div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-5 mb-10">
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] text-center border border-white">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المحـصل</p>
                       <p className="text-2xl font-black text-emerald-600">${s.total_paid}</p>
                    </div>
                    <div className={`p-6 rounded-[2.5rem] text-center border-2 ${s.remaining_balance > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-xl shadow-rose-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-xl shadow-emerald-100'}`}>
                       <p className="text-[10px] font-black opacity-60 uppercase mb-1">المتبقي</p>
                       <p className="text-2xl font-black">${s.remaining_balance}</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                 >
                    <CreditCard size={20} /> تسجيل دفعة جديدة
                 </button>
              </div>
             );
           }) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                 <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"><Search size={48}/></div>
                 <p className="text-slate-400 font-black text-xl">لا توجد سجلات مالية نشطة لهذه الفترة.</p>
                 <button onClick={fetchFinancialData} className="mt-6 text-indigo-600 font-black text-sm hover:underline flex items-center justify-center gap-2 mx-auto"><RefreshCw size={16}/> إعادة تحديث الرادار المالي</button>
              </div>
           )}
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden animate-in slide-in-from-bottom-12">
           <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-3xl font-black flex items-center gap-6 text-slate-900"><History className="text-indigo-600" /> كشف المعاملات التاريخي</h3>
              <button onClick={fetchFinancialData} className="p-5 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
           </div>
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right min-w-[900px]">
                 <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                       <th className="px-12 py-8">اسم الطالب</th>
                       <th className="px-12 py-8">المبلغ</th>
                       <th className="px-12 py-8">التاريخ</th>
                       <th className="px-12 py-8">الوسيلة</th>
                       <th className="px-12 py-8 text-center">الإجراء</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allPayments.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-12 py-8 font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{p.students?.name}</td>
                          <td className="px-12 py-8 font-black text-emerald-600 text-xl">${p.amount}</td>
                          <td className="px-12 py-8 text-slate-400 font-bold text-sm"><Calendar size={14} className="inline ml-2"/> {p.payment_date}</td>
                          <td className="px-12 py-8"><span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100">{p.payment_method}</span></td>
                          <td className="px-12 py-8 text-center">
                             <button onClick={async () => {
                                if (confirm("حذف هذه المعاملة؟")) {
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

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-8 bg-slate-900/70 backdrop-blur-3xl">
           <form onSubmit={handleSavePayment} className="bg-white p-14 rounded-[5rem] w-full max-w-xl shadow-2xl space-y-10 animate-in zoom-in duration-500 text-right relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900">تحصيل دفعة مالية</h3>
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mt-2">إيداع لحساب الطالب: {selectedStudent?.name}</p>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المبلغ المدفوع ($)</label>
                    <div className="relative">
                       <DollarSign className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 p-1.5 rounded-xl" size={32} />
                       <input required type="number" step="0.5" placeholder="0.00" className="w-full pr-20 pl-8 py-8 bg-slate-50 rounded-[2.5rem] font-black border-none focus:ring-4 ring-emerald-50 outline-none text-4xl shadow-inner text-center" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">تاريخ العملية</label>
                       <input type="date" className="w-full p-6 bg-slate-50 rounded-[2rem] font-black border-none text-sm shadow-inner" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الوسيلة</label>
                       <select className="w-full p-6 bg-slate-50 rounded-[2rem] font-black border-none text-sm shadow-inner" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                          <option value="كاش">نقدي (كاش)</option><option value="كي نت">رابط بنكي</option><option value="تحويل">تحويل بنكي</option>
                       </select>
                    </div>
                 </div>
              </div>

              <button disabled={loading} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all active:scale-95">
                 {loading ? <RefreshCw className="animate-spin" /> : <DollarSign size={28} />} تأكيد التحصيل المالي
              </button>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
           </form>
        </div>
      )}
    </div>
  );
};

export default Payments;
