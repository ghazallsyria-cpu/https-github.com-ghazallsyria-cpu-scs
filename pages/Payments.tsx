
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Wallet, Plus, X, DollarSign, Trash2, Search, RefreshCw, 
  History, CheckCircle, AlertCircle, CreditCard, Calendar, Folder, ChevronDown
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
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);

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
      
      const filteredStds = (stds || []).filter(s => 
        (s.academic_year === year && s.semester === semester) || (!s.academic_year)
      );
      setStudents(filteredStds);

      let qPays = supabase.from('payments').select('*, students!inner(name, academic_year, semester)');
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      
      const { data: pays } = await qPays.order('payment_date', { ascending: false });
      
      const filteredPays = (pays || []).filter((p: any) => 
        (p.students?.academic_year === year && p.students?.semester === semester) || (!p.students?.academic_year)
      );
      setAllPayments(filteredPays);

      // توسيع كافة المجلدات افتراضياً
      // Fix: Explicitly type the grades array as string[] to avoid 'unknown[]' type error
      const grades: string[] = Array.from(new Set(filteredStds.map((s: any) => String(s.grade))));
      setExpandedGrades(grades);

    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const stats = useMemo(() => {
    const totalCollected = students.reduce((acc, s) => acc + Number(s.total_paid || 0), 0);
    const totalDebt = students.reduce((acc, s) => acc + Math.max(0, Number(s.remaining_balance || 0)), 0);
    return { totalCollected, totalDebt };
  }, [students]);

  // تجميع الطلاب حسب المجلدات
  const groupedStudents = useMemo(() => {
    const filtered = students.filter(s => {
      const matchesSearch = s.name.includes(searchTerm);
      if (filterType === 'debt') return matchesSearch && s.remaining_balance > 0;
      if (filterType === 'cleared') return matchesSearch && s.remaining_balance <= 0;
      return matchesSearch;
    });

    return filtered.reduce((acc, s) => {
      const grade = String(s.grade || 'غير محدد');
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(s);
      return acc;
    }, {} as any);
  }, [students, searchTerm, filterType]);

  const sortedGrades = useMemo(() => {
    return Object.keys(groupedStudents).sort((a, b) => {
      if (isNaN(Number(a)) || isNaN(Number(b))) return a.localeCompare(b);
      return Number(b) - Number(a);
    });
  }, [groupedStudents]);

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

  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  return (
    <div className="space-y-12 animate-diamond">
      {/* Wealth Meter */}
      <div className="bg-slate-900 p-10 md:p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
         <div className="relative z-10 flex items-center gap-6 md:gap-10">
            <div className="bg-indigo-600 p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 rotate-6"><Wallet size={40} /></div>
            <div>
               <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 leading-none">المركز المالي الماسي</h2>
               <p className="text-indigo-400 font-black text-sm uppercase tracking-widest">فصل {semester} - سنة {year}</p>
            </div>
         </div>
         
         <div className="relative z-10 grid grid-cols-2 gap-8 md:gap-12 w-full md:w-auto">
            <div className="text-center">
               <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block mb-2">إيرادات محصلة</span>
               <h4 className="text-3xl md:text-5xl font-black">${stats.totalCollected.toLocaleString()}</h4>
            </div>
            <div className="text-center">
               <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest block mb-2">ديون مستحقة</span>
               <h4 className="text-3xl md:text-5xl font-black">${stats.totalDebt.toLocaleString()}</h4>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 blur-[150px] rounded-full"></div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
         <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-50 w-full lg:w-auto">
            <button onClick={() => setViewMode('students')} className={`flex-1 lg:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all duration-500 ${viewMode === 'students' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>تحصيل الديون</button>
            <button onClick={() => setViewMode('history')} className={`flex-1 lg:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all duration-500 ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>سجل الدفعات</button>
         </div>
         
         <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
               <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input placeholder="البحث في الأسماء والديون..." className="w-full pr-14 pl-6 py-4 bg-white border border-slate-100 rounded-[2.5rem] font-bold focus:ring-4 ring-indigo-50 outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {viewMode === 'students' && (
               <div className="flex gap-2">
                  <button onClick={() => setFilterType('all')} className={`p-4 rounded-[1.5rem] transition-all border ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`} title="الكل"><History size={18}/></button>
                  <button onClick={() => setFilterType('debt')} className={`p-4 rounded-[1.5rem] transition-all border ${filterType === 'debt' ? 'bg-rose-600 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`} title="المديونون فقط"><AlertCircle size={18}/></button>
                  <button onClick={() => setFilterType('cleared')} className={`p-4 rounded-[1.5rem] transition-all border ${filterType === 'cleared' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`} title="المسددون بالكامل"><CheckCircle size={18}/></button>
               </div>
            )}
         </div>
      </div>

      {viewMode === 'students' ? (
        <div className="space-y-8">
           {loading ? (
             <div className="py-24 text-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="font-black text-slate-400 text-xs tracking-widest uppercase">جاري فرز المجلدات المالية...</p>
             </div>
           ) : sortedGrades.length > 0 ? sortedGrades.map(grade => (
             <div key={grade} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleGrade(grade)}
                  className="w-full p-10 flex items-center justify-between hover:bg-slate-50 transition-all group text-right"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <Folder size={28} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">طلاب الصف {grade}</h3>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">تحصيل: ${groupedStudents[grade].reduce((a:any, b:any) => a + b.total_paid, 0).toLocaleString()}</span>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">ديون: ${groupedStudents[grade].reduce((a:any, b:any) => a + b.remaining_balance, 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`text-slate-200 transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={32} />
                </button>

                {expandedGrades.includes(grade) && (
                  <div className="p-10 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                    {groupedStudents[grade].map((s: any) => {
                      const progress = Math.min(100, (s.total_paid / s.expected_total) * 100) || 0;
                      return (
                        <div key={s.id} className="bg-slate-50 p-8 rounded-[3.5rem] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                           <div className="flex items-center gap-6 mb-8">
                              <div className="w-14 h-14 bg-white text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">{s.name[0]}</div>
                              <div className="flex-1 min-w-0 pr-2">
                                 <h3 className="text-lg font-black text-slate-900 truncate leading-tight mb-1">{s.name}</h3>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.group_name || 'طلاب فردي'}</span>
                              </div>
                           </div>

                           <div className="space-y-4 mb-8">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-slate-400">تقدم السداد</span>
                                 <span className={progress === 100 ? 'text-emerald-500' : 'text-indigo-600'}>{Math.round(progress)}%</span>
                              </div>
                              <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                                 <div className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${progress}%`}}></div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mb-8">
                              <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">المحـصل</p>
                                 <p className="text-xl font-black text-emerald-600">${s.total_paid}</p>
                              </div>
                              <div className={`p-4 rounded-2xl text-center border-2 ${s.remaining_balance > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-xl shadow-rose-100/30' : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-xl shadow-emerald-100/30'}`}>
                                 <p className="text-[9px] font-black opacity-60 uppercase mb-1">المتبقي</p>
                                 <p className="text-xl font-black">${s.remaining_balance}</p>
                              </div>
                           </div>

                           <button 
                            onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                           >
                              <CreditCard size={18} /> تسجيل دفعة
                           </button>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
           )) : (
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
           <form onSubmit={handleSavePayment} className="bg-white p-10 md:p-14 rounded-[5rem] w-full max-w-xl shadow-2xl space-y-10 animate-in zoom-in duration-500 text-right relative overflow-hidden">
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
                       <input required type="number" step="0.5" placeholder="0.00" className="w-full pr-20 pl-8 py-6 bg-slate-50 rounded-[2.5rem] font-black border-none focus:ring-4 ring-emerald-50 outline-none text-4xl shadow-inner text-center" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
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
           </form>
        </div>
      )}
    </div>
  );
};

export default Payments;
