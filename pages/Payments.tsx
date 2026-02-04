
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { Wallet, Plus, X, ArrowDownRight, DollarSign, CheckCircle, User, AlertCircle, History, Trash2, Calendar, FileText, Clock, Folder, FolderOpen, Search } from 'lucide-react';

const Payments = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedGradeFolder, setSelectedGradeFolder] = useState<string>('الكل');
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
      let qStds = supabase.from('student_summary_view').select('*, profiles:teacher_id(full_name)').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds;

      const studentIds = stds?.map(s => s.id) || [];
      let qPays = supabase.from('payments').select('*, students(name)').in('student_id', studentIds);
      if (!isAdmin) qPays = qPays.eq('teacher_id', uid);
      const { data: pays } = await qPays;
      
      setAllPayments(pays || []);
      setStudents(stds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const { error } = await supabase.from('payments').insert([{
      student_id: selectedStudent.id,
      teacher_id: uid,
      amount: parseFloat(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      payment_number: paymentForm.payment_number,
      is_final: paymentForm.is_final,
      notes: paymentForm.notes
    }]);

    if (error) showFeedback("فشل تسجيل الدفعة: " + error.message, 'error');
    else {
      showFeedback('تم تسجيل الدفعة النقدية بنجاح!');
      setIsModalOpen(false);
      setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', payment_method: 'كاش', payment_number: 'الأولى', is_final: false });
      fetchFinancialData();
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل المالي؟')) return;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) showFeedback("فشل الحذف", 'error');
    else {
      showFeedback("تم الحذف بنجاح");
      fetchFinancialData();
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesFolder = selectedGradeFolder === 'الكل' || s.grade === selectedGradeFolder;
      const matchesSearch = s.name.includes(searchTerm);
      return matchesFolder && matchesSearch;
    });
  }, [students, selectedGradeFolder, searchTerm]);

  const gradeCounts = useMemo(() => {
    const counts: any = { '10': 0, '11': 0, '12': 0, 'الكل': students.length };
    students.forEach(s => { if (counts[s.grade] !== undefined) counts[s.grade]++; });
    return counts;
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative text-right pb-20">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600"><Wallet size={28}/></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">سجل المدفوعات</h1>
            <p className="text-slate-400 font-bold text-xs">إجمالي الديون: <span className="text-rose-600">${students.reduce((acc, s) => acc + Math.max(0, s.remaining_balance), 0).toLocaleString()}</span></p>
          </div>
        </div>
        <div className="relative w-full md:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
             placeholder="بحث عن طالب مالي..." 
             className="w-full pr-10 pl-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Folders Navigation */}
      <div className="flex flex-wrap gap-4 animate-in slide-in-from-top duration-700">
        {[
          { id: 'الكل', label: 'كافة الطلاب' },
          { id: '10', label: 'الصف العاشر (10)' },
          { id: '11', label: 'الحادي عشر (11)' },
          { id: '12', label: 'الثاني عشر (12)' },
        ].map((folder) => {
          const isActive = selectedGradeFolder === folder.id;
          const count = gradeCounts[folder.id];
          return (
            <button
              key={folder.id}
              onClick={() => setSelectedGradeFolder(folder.id)}
              className={`flex-1 min-w-[140px] p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                isActive ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                {isActive ? <FolderOpen size={24} /> : <Folder size={24} />}
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-black ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{folder.label}</p>
                <p className={`text-[9px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>{count} طالب</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest">
                <th className="p-6">الطالب</th>
                <th className="p-6">المستحق</th>
                <th className="p-6">المسدد</th>
                <th className="p-6">المتبقي</th>
                <th className="p-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <button onClick={() => { setSelectedStudent(s); setIsDetailModalOpen(true); }} className="text-right group">
                      <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">الصف {s.grade} | {s.is_hourly ? 'بالساعة' : 'فصلي'}</p>
                    </button>
                  </td>
                  <td className="p-6 font-bold text-slate-600">${s.expected_income.toLocaleString()}</td>
                  <td className="p-6 font-black text-emerald-600">${s.total_paid.toLocaleString()}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${s.remaining_balance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {s.remaining_balance > 0 ? `$${s.remaining_balance.toLocaleString()}` : 'خالص'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }}
                      className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-600 transition-all shadow-xl"
                    >
                      تسجيل دفعة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Payment Entry */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddPayment} className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">تسجيل دفعة نقدية</h2>
            <div className="space-y-5">
               <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                  <p className="text-xs font-bold text-indigo-600">تسجيل مبلغ للطالب:</p>
                  <p className="text-lg font-black text-slate-900">{selectedStudent.name}</p>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase mr-3">المبلغ ($)</label>
                 <input required type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xl" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-3">الوسيلة</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                       <option value="كاش">كاش</option>
                       <option value="كي نت">كي نت</option>
                       <option value="ومض">ومض</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-3">الدفعة رقم</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs" value={paymentForm.payment_number} onChange={e => setPaymentForm({...paymentForm, payment_number: e.target.value})}>
                       <option value="الأولى">الأولى</option>
                       <option value="الثانية">الثانية</option>
                       <option value="الثالثة">الثالثة</option>
                       <option value="الأخيرة">الأخيرة</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase mr-3">ملاحظات</label>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs h-20" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
               </div>
            </div>
            <button className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl mt-8 shadow-2xl hover:bg-indigo-700 transition-all">تأكيد الاستلام</button>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto p-10 rounded-[3.5rem] shadow-2xl relative">
            <button type="button" onClick={() => setIsDetailModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">سجل المدفوعات: {selectedStudent.name}</h2>
            <div className="space-y-4">
              {allPayments.filter(p => p.student_id === selectedStudent.id).map(p => (
                <div key={p.id} className="p-5 border border-slate-100 rounded-[2rem] flex justify-between items-center group">
                  <div>
                    <p className="font-black text-slate-900">الدفعة {p.payment_number} (${p.amount})</p>
                    <p className="text-[10px] text-slate-400 font-bold">{p.payment_method} | {new Date(p.payment_date).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <button onClick={() => handleDeletePayment(p.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                </div>
              ))}
              {allPayments.filter(p => p.student_id === selectedStudent.id).length === 0 && (
                <p className="text-center py-10 text-slate-400 font-bold italic">لا توجد دفعات مسجلة.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
