
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { StudentStats } from '../types';
import { Wallet, Plus, Search, CheckCircle, AlertCircle, CreditCard, ChevronRight } from 'lucide-react';

const Payments = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      let qStudents = supabase.from('students').select('*');
      let qPayments = supabase.from('payments').select('*');

      if (role === 'teacher') {
        qStudents = qStudents.eq('teacher_id', uid);
        qPayments = qPayments.eq('teacher_id', uid);
      }

      const { data: stds } = await qStudents;
      const { data: pays } = await qPayments;
      
      const enriched = (stds || []).map(student => {
        const totalPaid = (pays || []).filter(p => p.student_id === student.id).reduce((sum, p) => sum + Number(p.amount), 0);
        return { 
          ...student, 
          total_lessons: 0, 
          total_hours: 0, 
          total_paid: totalPaid, 
          remaining_balance: Number(student.agreed_amount) - totalPaid 
        };
      });
      setStudents(enriched);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [role, uid]);

  useEffect(() => { fetchPaymentData(); }, [fetchPaymentData]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('payments').insert([{
        student_id: selectedStudent.id, 
        amount: parseFloat(paymentForm.amount), 
        payment_date: paymentForm.payment_date, 
        notes: paymentForm.notes || '',
        teacher_id: uid // إجباري حسب البرومبت
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchPaymentData();
    } catch (err: any) { alert('خطأ في التسجيل: ' + err.message); }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">المالية والمدفوعات</h1>
          <p className="text-slate-500 font-bold">تتبع المبالغ المحصلة والمستحقة لكل طالب.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-8 rounded-[2rem] flex items-center gap-6 border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg relative z-10"><Wallet size={32}/></div>
          <div className="relative z-10">
            <p className="text-emerald-700 font-bold text-sm">إجمالي المحصل</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">${students.reduce((s, st) => s + st.total_paid, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-rose-50 p-8 rounded-[2rem] flex items-center gap-6 border border-rose-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
          <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg relative z-10"><AlertCircle size={32}/></div>
          <div className="relative z-10">
            <p className="text-rose-700 font-bold text-sm">إجمالي المتبقي</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">${students.reduce((s, st) => s + Math.max(0, st.remaining_balance), 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              placeholder="ابحث عن طالب..." 
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-black text-xs uppercase tracking-wider">
                <th className="px-8 py-5">اسم الطالب</th>
                <th className="px-8 py-5">المبلغ المتفق عليه</th>
                <th className="px-8 py-5">المحصل حتى الآن</th>
                <th className="px-8 py-5">المتبقي</th>
                <th className="px-8 py-5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${student.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none">{student.name}</p>
                        {student.is_completed && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1"><CheckCircle size={10}/> سداد مكتمل</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-600">${student.agreed_amount}</td>
                  <td className="px-8 py-5 font-black text-emerald-600">${student.total_paid}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${student.remaining_balance <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                       ${Math.max(0, student.remaining_balance)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => {setSelectedStudent(student); setIsModalOpen(true);}} 
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                    >
                      <Plus size={14}/> دفعة جديدة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 animate-in zoom-in duration-200 shadow-2xl">
            <h2 className="text-2xl font-black mb-1 text-right">تحصيل مبلغ مالي</h2>
            <p className="text-slate-500 mb-6 font-bold text-right italic">للطالب: <span className="text-indigo-600 not-italic">{selectedStudent?.name}</span></p>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-1 text-right">
                <label className="text-xs font-black text-slate-400 mr-2">المبلغ المستلم ($)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                  <input required type="number" step="0.01" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-black pl-12" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <label className="text-xs font-black text-slate-400 mr-2">تاريخ استلام المبلغ</label>
                <input required type="date" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-right font-bold" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
              </div>
              <textarea placeholder="ملاحظات (مثلاً: دفعة عن شهر يناير)" className="w-full p-4 border rounded-2xl outline-none text-right font-bold h-24 focus:ring-2 focus:ring-indigo-500" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold border rounded-2xl hover:bg-slate-50 transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all">تأكيد الاستلام</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
