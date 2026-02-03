import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Wallet, Plus, X, ArrowDownRight, DollarSign } from 'lucide-react';

const Payments = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchFinancialData = async () => {
    setLoading(true);
    let qStds = supabase.from('students').select('*');
    let qPays = supabase.from('payments').select('*');
    
    if (role === 'teacher') {
      qStds = qStds.eq('teacher_id', uid);
      qPays = qPays.eq('teacher_id', uid);
    }
    
    const [{ data: stds }, { data: pays }] = await Promise.all([qStds, qPays]);
    
    const enriched = (stds || []).map(s => {
      const totalPaid = (pays || []).filter(p => p.student_id === s.id).reduce((acc, p) => acc + p.amount, 0);
      return { ...s, totalPaid, balance: s.agreed_amount - totalPaid };
    });
    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchFinancialData(); }, [uid, role]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const { error } = await supabase.from('payments').insert([{
      student_id: selectedStudent.id,
      teacher_id: uid,
      amount: parseFloat(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      notes: paymentForm.notes
    }]);

    if (error) alert("خطأ في تسجيل الدفعة: " + error.message);
    else {
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchFinancialData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><Wallet size={24}/></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">إدارة المدفوعات</h1>
            <p className="text-slate-500 font-bold">تتبع مستحقاتك من الطلاب وتسجيل الدفعات.</p>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">إجمالي الديون المعلقة</p>
          <p className="text-2xl font-black text-rose-600">${students.reduce((acc, s) => acc + s.balance, 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-6 font-black">الطالب</th>
                <th className="p-6 font-black">الاتفاق المالي</th>
                <th className="p-6 font-black">المسدد حتى الآن</th>
                <th className="p-6 font-black">المتبقي (دين)</th>
                <th className="p-6 font-black text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400 font-bold">{s.grade}</p>
                  </td>
                  <td className="p-6 font-bold text-slate-600">${s.agreed_amount}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 font-black text-emerald-600">
                      <ArrowDownRight size={14}/>
                      ${s.totalPaid}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-black ${s.balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {s.balance > 0 ? `$${s.balance}` : 'خالص'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                    >
                      <Plus size={16}/> تسجيل دفعة
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-20 text-center font-bold text-slate-400 italic">لا يوجد طلاب مسجلين لعرض بياناتهم المالية.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">تسجيل دفعة نقدية</h2>
                <p className="text-indigo-600 font-bold text-sm">للطالب: {selectedStudent?.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddPayment} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">المبلغ المسدد ($)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="number" placeholder="مثال: 100" className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </div>
                <p className="text-[10px] text-slate-400 mr-2 mt-1 italic font-bold">المتبقي حالياً على الطالب: ${selectedStudent?.balance}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">تاريخ الدفع</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 mr-2">ملاحظات (اختياري)</label>
                <input placeholder="مثال: دفعة شهر أكتوبر" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-slate-100 transition-all">تأكيد التسجيل</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;