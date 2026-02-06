import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { Wallet, Plus, X, DollarSign, CheckCircle, AlertCircle, Trash2, Search, Edit3, Save, RefreshCw, Folder, FolderOpen } from 'lucide-react';

const Payments = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentForm, setPaymentForm] = useState({ 
    amount: '', 
    payment_date: new Date().toISOString().split('T')[0], 
    notes: '',
    payment_method: 'كاش',
    payment_number: 'الأولى',
    is_final: false
  });
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchFinancialData = useCallback(async () => {
    setLoading(true);
    try {
      let qStds = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds;

      const studentIds = stds?.map(s => s.id) || [];
      let qPays = supabase.from('payments').select('*, students(name)').in('student_id', studentIds);
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      const { data: pays } = await qPays;
      
      setAllPayments(pays || []);
      setStudents(stds || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        payment_number: paymentForm.payment_number,
        is_final: paymentForm.is_final,
        notes: paymentForm.notes
      };
      if (isEditMode && selectedPaymentId) {
        await supabase.from('payments').update(payload).eq('id', selectedPaymentId);
      } else {
        await supabase.from('payments').insert([{ ...payload, student_id: selectedStudent.id, teacher_id: uid }]);
      }
      setIsModalOpen(false); fetchFinancialData();
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-[3rem] border flex justify-between items-center">
        <h1 className="text-3xl font-black">المركز المالي</h1>
        <input placeholder="بحث..." className="bg-slate-50 p-4 rounded-2xl outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        {students.filter(s => s.name.includes(searchTerm)).map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[3rem] border">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black">{s.name}</h3>
                <button onClick={() => { setSelectedStudent(s); setIsEditMode(false); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black">تسجيل دفعة</button>
             </div>
             <p className="text-rose-600 font-black">المتبقي: ${s.remaining_balance.toLocaleString()}</p>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSavePayment} className="bg-white p-10 rounded-[3rem] w-full max-w-md">
            <h2 className="text-2xl font-black mb-8">تسجيل مبلغ</h2>
            <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl mb-4" placeholder="المبلغ" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">حفظ</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full mt-4 text-slate-400 font-black">إلغاء</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Payments;