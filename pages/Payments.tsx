
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { StudentStats } from '../types';
import { 
  Wallet, CheckCircle2, Clock, Plus, Search, X, CreditCard, AlertCircle
} from 'lucide-react';

const Payments: React.FC = () => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: studentsData } = await supabase.from('students').select('*');
      const { data: paymentsData } = await supabase.from('payments').select('*');
      const enriched = (studentsData || []).map(student => {
        const totalPaid = (paymentsData || []).filter(p => p.student_id === student.id).reduce((sum, p) => sum + Number(p.amount), 0);
        return { ...student, total_lessons: 0, total_hours: 0, total_paid: totalPaid, remaining_balance: Number(student.agreed_payment) - totalPaid };
      });
      setStudents(enriched);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPaymentData(); }, [fetchPaymentData]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('payments').insert([{
        student_id: selectedStudent.id, 
        amount: parseFloat(paymentForm.amount), 
        payment_date: paymentForm.payment_date, 
        notes: paymentForm.notes || ''
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchPaymentData();
      alert('✅ تم تسجيل استلام المبلغ بنجاح!');
    } catch (err: any) { 
      console.error(err);
      alert(`خطأ! تأكد من وجود حقل payment_date في جدول payments. التفاصيل: ${err.message}`); 
    }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-900">المالية والمدفوعات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-8 rounded-3xl flex items-center gap-5 border border-emerald-100 shadow-sm">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200"><Wallet size={32}/></div>
          <div>
            <p className="text-emerald-700 font-bold text-lg">إجمالي المحصل</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">${students.reduce((s, st) => s + st.total_paid, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-rose-50 p-8 rounded-3xl flex items-center gap-5 border border-rose-100 shadow-sm">
          <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200"><AlertCircle size={32}/></div>
          <div>
            <p className="text-rose-700 font-bold text-lg">إجمالي المتبقي</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">${students.reduce((s, st) => s + Math.max(0, st.remaining_balance), 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 font-black text-sm">
                <th className="px-6 py-5">اسم الطالب</th>
                <th className="px-6 py-5">المبلغ الكلي</th>
                <th className="px-6 py-5">المبلغ المدفوع</th>
                <th className="px-6 py-5">المبلغ المتبقي</th>
                <th className="px-6 py-5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">{student.name}</td>
                  <td className="px-6 py-4 font-bold text-slate-600">${student.agreed_payment}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">${student.total_paid}</td>
                  <td className="px-6 py-4">
                    <span className={`font-black ${student.remaining_balance <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                       ${Math.max(0, student.remaining_balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => {setSelectedStudent(student); setIsModalOpen(true);}} 
                      className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100"
                    >
                      سجل دفعة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in duration-200 shadow-2xl">
            <h2 className="text-2xl font-black mb-1 text-right">تحصيل مبلغ مالي</h2>
            <p className="text-slate-500 mb-6 font-bold text-right">للطالب: <span className="text-indigo-600">{selectedStudent?.name}</span></p>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">المبلغ المستلم ($)</label>
                <input required type="number" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-black" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">تاريخ الدفع</label>
                <input required type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-bold" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="block text-sm font-bold mb-1 mr-1 text-slate-600">ملاحظات (اختياري)</label>
                <textarea className="w-full p-3 border rounded-xl outline-none text-right font-bold h-24" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">تأكيد الاستلام</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 text-slate-400 font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
