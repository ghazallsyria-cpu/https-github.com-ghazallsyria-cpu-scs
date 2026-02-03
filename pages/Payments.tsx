
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

  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

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
        student_id: selectedStudent.id, amount: parseFloat(paymentForm.amount), date: paymentForm.date, notes: paymentForm.notes
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchPaymentData();
      alert('تم تسجيل الدفعة بنجاح!');
    } catch (err) { alert('خطأ! هل أنشأت جدول payments؟'); }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-900">المالية والمدفوعات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-6 rounded-3xl flex items-center gap-4 border border-emerald-100">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl"><Wallet size={28}/></div>
          <div><p className="text-emerald-700 font-bold">إجمالي المحصل</p><p className="text-3xl font-black text-slate-900">${students.reduce((s, st) => s + st.total_paid, 0)}</p></div>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl flex items-center gap-4 border border-rose-100">
          <div className="p-4 bg-rose-500 text-white rounded-2xl"><AlertCircle size={28}/></div>
          <div><p className="text-rose-700 font-bold">إجمالي المتبقي</p><p className="text-3xl font-black text-slate-900">${students.reduce((s, st) => s + Math.max(0, st.remaining_balance), 0)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b">
              <tr className="text-slate-500 font-black text-sm">
                <th className="px-6 py-4">اسم الطالب</th>
                <th className="px-6 py-4">المبلغ المتفق عليه</th>
                <th className="px-6 py-4">المدفوع</th>
                <th className="px-6 py-4">المتبقي</th>
                <th className="px-6 py-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-black text-slate-900">{student.name}</td>
                  <td className="px-6 py-4 font-bold">${student.agreed_payment}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">${student.total_paid}</td>
                  <td className="px-6 py-4 font-black text-rose-500">${Math.max(0, student.remaining_balance)}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => {setSelectedStudent(student); setIsModalOpen(true);}} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors">سجل دفعة</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-1">تسجيل دفعة جديدة</h2>
            <p className="text-slate-500 mb-6 font-bold">للطالب: {selectedStudent?.name}</p>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">المبلغ المستلم ($)</label>
                <input required type="number" className="w-full p-3 border rounded-xl outline-none" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">تاريخ الدفع</label>
                <input required type="date" className="w-full p-3 border rounded-xl outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100">تأكيد استلام المبلغ</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 text-slate-400 font-bold">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
