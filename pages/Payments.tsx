
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { Wallet, Plus, X, ArrowDownRight, DollarSign, CheckCircle, User, AlertCircle, History, Trash2, Calendar, FileText } from 'lucide-react';

const Payments = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      let qStds = supabase.from('students').select('*, profiles:teacher_id(full_name)');
      let qPays = supabase.from('payments').select('*, students(name)');
      
      if (!isAdmin) {
        qStds = qStds.eq('teacher_id', uid);
        qPays = qPays.eq('teacher_id', uid);
      }
      
      const [{ data: stds }, { data: pays }] = await Promise.all([qStds, qPays]);
      
      setAllPayments(pays || []);

      const enriched = (stds || []).map(s => {
        const studentPayments = (pays || []).filter(p => p.student_id === s.id);
        const totalPaid = studentPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        return { 
          ...s, 
          totalPaid, 
          balance: Number(s.agreed_amount) - totalPaid,
          paymentsCount: studentPayments.length 
        };
      });
      setStudents(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFinancialData(); }, [uid, role, isAdmin]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const { error } = await supabase.from('payments').insert([{
      student_id: selectedStudent.id,
      teacher_id: selectedStudent.teacher_id,
      amount: parseFloat(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      notes: paymentForm.notes
    }]);

    if (error) showFeedback("فشل تسجيل الدفعة: " + error.message, 'error');
    else {
      showFeedback('تم تسجيل الدفعة النقدية بنجاح!');
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchFinancialData();
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل المالي؟ سيؤدي ذلك لتغيير رصيد الطالب.')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) showFeedback("فشل الحذف", 'error');
    else {
      showFeedback("تم الحذف بنجاح");
      fetchFinancialData();
    }
  };

  const openDetails = (student: any) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const studentSpecificPayments = selectedStudent 
    ? allPayments.filter(p => p.student_id === selectedStudent.id).sort((a,b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all animate-in slide-in-from-top-full ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
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
                    <button 
                      onClick={() => openDetails(s)}
                      className="text-right group hover:text-indigo-600 transition-colors"
                    >
                      <p className="font-black text-slate-900 group-hover:text-indigo-600">{s.name}</p>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <History size={10} /> عرض السجل ({s.paymentsCount})
                      </p>
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="p-6">
                      <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
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

      {/* نافذة تسجيل دفعة */}
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

      {/* نافذة تفاصيل سجل الدفعات */}
      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            
            <div className="p-10 pb-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-6">
                <div className="bg-indigo-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">{selectedStudent.name}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedStudent.grade}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <span className="text-xs font-bold text-indigo-500 flex items-center gap-1"><Calendar size={12}/> انضم في {new Date(selectedStudent.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="bg-slate-50 p-4 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {/* إحصائيات مصغرة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">إجمالي المبلغ المتفق عليه</p>
                  <p className="text-2xl font-black text-slate-900">${selectedStudent.agreed_amount.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">المبلغ المسدد إجمالاً</p>
                  <p className="text-2xl font-black text-emerald-700">${selectedStudent.totalPaid.toLocaleString()}</p>
                </div>
                <div className={`p-6 rounded-[2rem] border ${selectedStudent.balance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
                  <p className={`text-[10px] font-black uppercase mb-2 tracking-widest ${selectedStudent.balance > 0 ? 'text-rose-600' : 'text-indigo-600'}`}>الرصيد المتبقي (الدين)</p>
                  <p className={`text-2xl font-black ${selectedStudent.balance > 0 ? 'text-rose-700' : 'text-indigo-700'}`}>
                    {selectedStudent.balance > 0 ? `$${selectedStudent.balance.toLocaleString()}` : 'خالص بالكامل'}
                  </p>
                </div>
              </div>

              {/* جدول السجل */}
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <History size={20} className="text-indigo-600" /> سجل الدفعات النقدية
                </h3>
                {studentSpecificPayments.length > 0 ? (
                  <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="p-5">تاريخ الدفعة</th>
                          <th className="p-5">المبلغ</th>
                          <th className="p-5">الملاحظات</th>
                          <th className="p-5 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {studentSpecificPayments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-5">
                              <div className="flex items-center gap-2 font-bold text-slate-600">
                                <Calendar size={14} className="text-slate-300" />
                                {new Date(p.payment_date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                              </div>
                            </td>
                            <td className="p-5">
                              <span className="font-black text-emerald-600">${p.amount.toLocaleString()}</span>
                            </td>
                            <td className="p-5 text-sm text-slate-500 font-medium italic">
                              {p.notes || '-'}
                            </td>
                            <td className="p-5 text-center">
                              <button 
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                              ><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <FileText size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-bold italic">لا توجد دفعات مسجلة لهذا الطالب بعد.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 pt-4 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => { setIsDetailModalOpen(false); setIsModalOpen(true); }}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={20}/> تسجيل دفعة جديدة الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
