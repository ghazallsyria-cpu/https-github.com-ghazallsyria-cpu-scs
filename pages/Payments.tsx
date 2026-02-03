
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { StudentStats } from '../types';
import { 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react';

const Payments: React.FC = () => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: studentsData } = await supabase.from('students').select('*');
      const { data: paymentsData } = await supabase.from('payments').select('*');

      const enriched = (studentsData || []).map(student => {
        const studentPayments = (paymentsData || []).filter(p => p.student_id === student.id);
        const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          ...student,
          total_lessons: 0, 
          total_hours: 0,
          total_paid: totalPaid,
          remaining_balance: Number(student.agreed_payment) - totalPaid
        };
      });

      setStudents(enriched);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('payments').insert([{
        student_id: selectedStudent.id,
        amount: parseFloat(paymentForm.amount),
        date: paymentForm.date,
        notes: paymentForm.notes
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchPaymentData();
    } catch (err) {
      alert('Error recording payment');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-6 rounded-2xl flex items-center space-x-4">
          <Wallet className="text-emerald-600" />
          <div><p>Total Collected</p><p className="text-2xl font-bold">${students.reduce((s, st) => s + st.total_paid, 0)}</p></div>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl flex items-center space-x-4">
          <AlertCircle className="text-rose-600" />
          <div><p>Outstanding Debt</p><p className="text-2xl font-bold">${students.reduce((s, st) => s + Math.max(0, st.remaining_balance), 0)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Total Agreed</th>
              <th className="px-6 py-4">Paid</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id} className="border-b">
                <td className="px-6 py-4 font-bold">{student.name}</td>
                <td className="px-6 py-4">${student.agreed_payment}</td>
                <td className="px-6 py-4 text-emerald-600">${student.total_paid}</td>
                <td className="px-6 py-4 font-bold text-rose-500">${Math.max(0, student.remaining_balance)}</td>
                <td className="px-6 py-4">
                  <button onClick={() => {setSelectedStudent(student); setIsModalOpen(true);}} className="text-indigo-600 font-bold">Add Payment</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative">
            <h2 className="text-2xl font-bold mb-4">Record Payment for {selectedStudent?.name}</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <input required type="number" placeholder="Amount" className="w-full p-3 border rounded-xl" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              <input required type="date" className="w-full p-3 border rounded-xl" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Confirm Payment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
