
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { StudentStats } from '../types.ts';
import { Plus, MapPin, Phone, Calendar, Search, Trash2, CheckCircle, X, AlertCircle, Users, Edit3, Clock, DollarSign, ArrowRightLeft, RefreshCw, Copy, Move, Folder, ChevronLeft, LayoutGrid, Info } from 'lucide-react';

const Students = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [form, setForm] = useState({ 
    name: '', address: '', phone: '', grade: '', 
    agreed_amount: '0', is_hourly: false, price_per_hour: '0' 
  });

  const [transferForm, setTransferForm] = useState({ 
    targetYear: year, 
    targetSemester: semester === '1' ? '2' : '1', 
    includeData: false, 
    isMove: false,
    processing: false
  });

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view')
        .select('*')
        .eq('academic_year', year)
        .eq('semester', semester);
      
      if (!isAdmin) query = query.eq('teacher_id', uid);
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e: any) {
      showFeedback("خطأ في جلب البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // استخراج الصفوف الفريدة وحساب إحصائياتها
  const gradeGroups = useMemo(() => {
    const groups: Record<string, { count: number, debt: number }> = {};
    students.forEach(s => {
      const g = s.grade || 'غير محدد';
      if (!groups[g]) groups[g] = { count: 0, debt: 0 };
      groups[g].count += 1;
      groups[g].debt += Math.max(0, s.remaining_balance);
    });
    return Object.entries(groups).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedGrade) {
      list = list.filter(s => s.grade === selectedGrade);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(term) || s.phone.includes(term));
    }
    return list;
  }, [students, searchTerm, selectedGrade]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([{ 
        name: form.name, address: form.address, phone: form.phone, grade: form.grade,
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
        teacher_id: uid, academic_year: year, semester: semester
      }]);
      if (error) throw error;
      showFeedback('تمت الإضافة بنجاح');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { 
      showFeedback(err.message, 'error'); 
    }
  };

  const handleTransfer = async () => {
    if (!selectedStudent) return;
    setTransferForm(prev => ({ ...prev, processing: true }));
    try {
      const { data, error } = await supabase.rpc('handle_student_transfer', {
        source_student_id: selectedStudent.id,
        target_year: transferForm.targetYear,
        target_semester: transferForm.targetSemester,
        include_data: transferForm.includeData,
        is_move: transferForm.isMove
      });
      if (error) throw error;
      if (data.success) {
        showFeedback(data.message);
        setIsTransferModalOpen(false);
        fetchStudents();
      } else throw new Error(data.message);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setTransferForm(prev => ({ ...prev, processing: false }));
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('سيتم حذف الطالب وكافة بياناته، هل أنت متأكد؟')) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم الحذف بنجاح");
      fetchStudents();
    } catch (error: any) {
      showFeedback(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* الرأس (Header) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedGrade(null)}
            className={`p-4 rounded-2xl transition-all ${selectedGrade ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-600 text-white shadow-lg'}`}
          >
            <Users size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">الطلاب</h1>
              {selectedGrade && (
                <>
                  <ChevronLeft className="text-slate-300" size={20} />
                  <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-xs font-black">{selectedGrade}</span>
                </>
              )}
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">نظام إدارة المجلدات الذكية</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="بحث فوري..." 
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchStudents} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 text-sm">إضافة طالب</button>
        </div>
      </div>

      {/* عرض المجلدات (إذا لم يتم اختيار صف) */}
      {!selectedGrade && !searchTerm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-500">
          {gradeGroups.map(([grade, stats]) => (
            <div 
              key={grade} 
              onClick={() => setSelectedGrade(grade)}
              className="bg-white p-8 rounded-[3rem] border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="bg-amber-50 text-amber-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                  <Folder size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">{grade}</h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-black text-slate-400 uppercase">{stats.count} طالب</span>
                  {stats.debt > 0 && (
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black">ديون: ${stats.debt}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {gradeGroups.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center">
              <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Info size={48} />
              </div>
              <p className="text-slate-400 font-black text-lg">لا يوجد طلاب مسجلين حالياً، ابدأ بإضافة طالب جديد.</p>
            </div>
          )}
        </div>
      )}

      {/* عرض قائمة الطلاب (داخل مجلد أو عند البحث) */}
      {(selectedGrade || searchTerm) && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
             <button onClick={() => setSelectedGrade(null)} className="text-indigo-600 font-black text-sm flex items-center gap-2 hover:underline">
               <ChevronLeft size={16} /> العودة للمجلدات
             </button>
             <p className="text-slate-400 text-xs font-bold">عرض {filteredStudents.length} طالب</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-300 transition-all group hover:shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedStudent(s); setIsTransferModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-500" title="نقل أو نسخ"><ArrowRightLeft size={16}/></button>
                    <button onClick={() => handleDeleteStudent(s.id)} className="p-2 text-slate-400 hover:text-rose-500" title="حذف"><Trash2 size={16}/></button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-1">{s.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.grade}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[9px] font-black text-indigo-500 uppercase">
                    {s.is_hourly ? `سعر الساعة: $${s.price_per_hour}` : `إجمالي: $${s.agreed_amount}`}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs text-slate-500 font-bold mb-6">
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-300" /> {s.address || 'بدون عنوان'}</div>
                  <div className="flex items-center gap-2"><Phone size={14} className="text-slate-300" /> {s.phone || 'بدون هاتف'}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                   <div className="text-center">
                     <p className="text-[9px] text-slate-400 font-black">ساعات</p>
                     <p className="font-black text-slate-900">{s.total_hours}</p>
                   </div>
                   <div className="text-center border-x border-slate-100">
                     <p className="text-[9px] text-slate-400 font-black">المسدد</p>
                     <p className="font-black text-emerald-600">${s.total_paid}</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[9px] text-slate-400 font-black">الدين</p>
                     <p className={`font-black ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                       ${s.remaining_balance}
                     </p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsTransferModalOpen(false)} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><ArrowRightLeft size={24}/></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">نقل / نسخ الطالب</h2>
                <p className="text-indigo-600 font-bold text-sm">{selectedStudent.name}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">السنة المستهدفة</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={transferForm.targetYear} onChange={e => setTransferForm({...transferForm, targetYear: e.target.value})}>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">الفصل المستهدف</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={transferForm.targetSemester} onChange={e => setTransferForm({...transferForm, targetSemester: e.target.value})}>
                    <option value="1">الفصل الأول</option>
                    <option value="2">الفصل الثاني</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div onClick={() => setTransferForm({...transferForm, isMove: true})} className={`p-4 rounded-2xl border-2 cursor-pointer ${transferForm.isMove ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                  <p className="font-black text-sm">نقل (Move)</p>
                  <p className="text-[10px] text-slate-400">حذف من الفترة الحالية.</p>
                </div>
                <div onClick={() => setTransferForm({...transferForm, isMove: false})} className={`p-4 rounded-2xl border-2 cursor-pointer ${!transferForm.isMove ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}>
                  <p className="font-black text-sm">نسخ (Copy)</p>
                  <p className="text-[10px] text-slate-400">بقاء السجل في الفترتين.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl">
                <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={transferForm.includeData} onChange={e => setTransferForm({...transferForm, includeData: e.target.checked})} />
                <span className="text-xs font-black">تضمين كافة بيانات الدروس والمدفوعات</span>
              </div>
              <button disabled={transferForm.processing} onClick={handleTransfer} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-700 transition-all">
                {transferForm.processing ? "جاري المعالجة..." : "تأكيد العملية"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">إضافة طالب جديد</h2>
            <div className="space-y-4">
              <input required placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required placeholder="الصف الدراسي (مثلاً: الصف 10)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              <input placeholder="رقم الموبايل" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-left" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <input placeholder="العنوان" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} />
                <label className="text-sm font-black text-indigo-700">نظام الساعات؟</label>
              </div>
              {form.is_hourly ? (
                <input required type="number" placeholder="سعر الساعة ($)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
              ) : (
                <input required type="number" placeholder="المبلغ الفصلي الإجمالي ($)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
              )}
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl mt-8 shadow-xl hover:bg-indigo-700 transition-all">تأكيد الإضافة</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
