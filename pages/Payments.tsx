
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
  History,
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
      const { data: lessonsData } = await supabase.from('lessons').select('*');

      const enriched = (studentsData || []).map(student => {
        const studentPayments = (paymentsData || []).filter(p => p.student_id === student.id);
        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalLessons = (lessonsData || []).filter(l => l.student_id === student.id).length;
        const totalHours = (lessonsData || []).filter(l => l.student_id === student.id).reduce((s,l) => s + l.hours, 0);

        return {
          ...student,
          total_lessons: totalLessons,
          total_hours: totalHours,
          total_paid: totalPaid,
          remaining_balance: student.agreed_payment_amount - totalPaid
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Payment Management</h1>
        <p className="text-slate-500 mt-1">Track payments, balances, and financial status for each student.</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500 text-white rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-emerald-700 font-semibold">Total Collected</p>
            <p className="text-2xl font-bold text-slate-900">
              ${students.reduce((s, st) => s + st.total_paid, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-rose-500 text-white rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-rose-700 font-semibold">Outstanding Debt</p>
            <p className="text-2xl font-bold text-slate-900">
              ${students.reduce((s, st) => s + Math.max(0, st.remaining_balance), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Filter students by name..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Agreed Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">${student.agreed_payment_amount}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">${student.total_paid}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${student.remaining_balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      ${Math.max(0, student.remaining_balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {student.remaining_balance <= 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={12} className="mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        <Clock size={12} className="mr-1" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center text-indigo-600 font-bold hover:text-indigo-800"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Record Payment</h2>
                <p className="text-slate-500">{selectedStudent?.name}</p>
              </div>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input 
                    required
                    type="number" 
                    placeholder="250.00"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea 
                  placeholder="Cash payment for March..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-bold text-rose-500">${selectedStudent?.remaining_balance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Remaining After:</span>
                  <span className="font-bold text-slate-900">
                    ${Math.max(0, (selectedStudent?.remaining_balance || 0) - (parseFloat(paymentForm.amount) || 0))}
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center"
              >
                <History size={18} className="mr-2" />
                Confirm Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
