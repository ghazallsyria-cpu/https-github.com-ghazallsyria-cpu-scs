import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { Wallet, Plus, X, ArrowDownRight, DollarSign, CheckCircle, User } from 'lucide-react';

const Payments = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  const fetchFinancialData = async () => {
    setLoading(true);
    let qStds = supabase.from('students').select('*, profiles:teacher_id(full_name)');
    let qPays = supabase.from('payments').select('*');
    
    if (!isAdmin) {
      qStds = qStds.eq('teacher_id', uid);
      qPays = qPays.eq('teacher_id', uid);
    }
    
    const [{ data: stds }, { data: pays }] = await Promise.all([qStds, qPays]);
    
    const enriched = (stds || []).map(s => {
      const totalPaid = (pays || []).filter(p => p.student_id === s.id).reduce((acc, p) => acc + Number(p.amount), 0);
      return { ...s, totalPaid, balance: Number(s.agreed_amount) - totalPaid };
    });
    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchFinancialData(); }, [uid, role, isAdmin]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const { error } = await supabase.from('payments').insert([{
      student_id: selectedStudent.id,
      teacher_id: selectedStudent.teacher_id, // استخدام المعلم المالك للطالب
      amount: parseFloat(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      notes: paymentForm.notes
    }]);

    if (error) alert("خطأ في تسجيل الدفعة: " + error.message);
    else {
      setFeedback('تم تسجيل الدفعة بنجاح!');
      setTimeout(() => setFeedback(null), 3000);
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchFinancialData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {feedback && (
        <div className="fixed top-24 right-1/2 translate-x-1/2 z-[100] px-8 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold animate-in slide-in-from-top-full">
          <CheckCircle size={20} /> {feedback}
        </div>
      )}

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 shadow-inner"><Wallet size={28}/></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">إدارة المدفوعات</h1>
            <p className="text-slate-500 font-bold">{isAdmin ? 'مراجعة الموقف المالي لجميع الطلاب والمعلمين.' : 'تتبع مستحقاتك من الطلاب وتسجيل الدفعات.'}</p>
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">إجمالي الديون المعلقة {isAdmin ? '(للكل)' : ''}</p>
          <p className="text-3xl font-black text-rose-600">${students.reduce((acc, s) => acc + Math.max(0, s.balance), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs">
                <th className="p-6 font-black uppercase tracking-widest">الطالب</th>
                {isAdmin && <th className="p-6 font-black uppercase tracking-widest">المعلم</th>}
                <th className="p-6 font-black uppercase tracking-widest">الاتفاق المالي</th>
                <th className="p-6 font-black uppercase tracking-widest">المسدد حتى الآن</th>
                <th className="p-6 font-black uppercase tracking-widest">المتبقي (دين)</th>
                <th className="p-6 font-black uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400 font-bold">{s.grade}</p>
                  </td>
                  {isAdmin && (
                    <td className="p-6">
                      <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        <User size={10} /> {s.profiles?.full_name}
                      </div>
                    </td>
                  )}
                  <td className="p-6 font-bold text-slate-600">${Number(s.agreed_amount).toLocaleString()}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 font-black text-emerald-600">
                      <ArrowDownRight size={14}/>
                      ${s.totalPaid.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black ${s.balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {s.balance > 0 ? `$${s.balance.toLocaleString()}` : 'خالص'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 active:scale-95"
                    >
                      <Plus size={16}/> تسجيل دفعة
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-20 text-center font-bold text-slate-400 italic">لا يوجد طلاب مسجلين لعرض بياناتهم المالية.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 relative">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900">تسجيل دفعة نقدية</h2>
                <p className="text-indigo-600 font-bold text-sm mt-1">للطالب: {selectedStudent?.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddPayment} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase mr-3">المبلغ المسدد ($)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input required type="number" placeholder="مثال: 100" className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </div>
                <p className="text-[10px] text-slate-400 mr-3 mt-2 italic font-bold">المتبقي حالياً على الطالب: ${selectedStudent?.balance.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase mr-3">تاريخ الدفع</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase mr-3">ملاحظات (اختياري)</label>
                <input placeholder="مثال: دفعة شهر أكتوبر" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-2xl shadow-indigo-100 transition-all hover:-translate-y-1">تأكيد تسجيل الدفعة</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;