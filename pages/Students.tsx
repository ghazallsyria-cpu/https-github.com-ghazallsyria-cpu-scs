
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, Copy, MoveRight, CheckSquare, Square, CheckCircle2,
  MoreVertical, UserMinus, UserCheck, AlertTriangle, FileStack, Layers
} from 'lucide-react';

const Students = ({ isAdmin, profile, year, semester }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'edit' | 'move' | 'copy' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // بيانات الفصل المستهدف للنقل أو النسخ
  const [targetConfig, setTargetConfig] = useState({ year: year, semester: semester });

  const [form, setForm] = useState({
    name: '', grade: '12', group_name: '', address: '', academic_year: year, semester: semester,
    agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // جلب البيانات مع الفلترة حسب السنة والفصل
      let query = supabase.from('students').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', profile.id);
      
      const { data, error } = await query.order('grade', { ascending: false }).order('name');
      if (error) throw error;
      setStudents(data || []);
      
      // توسيع المجلدات التي تحتوي على طلاب
      const grades: string[] = Array.from(new Set((data || []).map((s: any) => String(s.grade))));
      setExpandedGrades(grades);
      setSelectedIds([]);
    } catch (err) { console.error("Fetch Error:", err); }
    finally { setLoading(false); }
  }, [isAdmin, profile.id, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllInGrade = (gradeStudents: any[]) => {
    const gradeIds = gradeStudents.map(s => s.id);
    const allSelected = gradeIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !gradeIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...gradeIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`تحذير: سيتم حذف ${selectedIds.length} طلاب نهائياً مع كافة سجلاتهم. هل أنت متأكد؟`)) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', selectedIds);
      if (error) throw error;
      alert("تم الحذف الجماعي بنجاح");
      fetchStudents();
    } catch (err: any) { alert("خطأ في الحذف: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleIndividualDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف الطالب "${name}"؟`)) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      fetchStudents();
    } catch (err: any) { alert("فشل الحذف: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleBulkMove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students')
        .update({ academic_year: targetConfig.year, semester: targetConfig.semester })
        .in('id', selectedIds);
      if (error) throw error;
      alert("تم نقل الطلاب إلى الفترة الجديدة.");
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert("فشل النقل: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleDuplicate = async (student: any) => {
    setIsProcessing(true);
    try {
      const { id, created_at, ...cleanData } = student;
      const { error } = await supabase.from('students').insert([{
        ...cleanData,
        academic_year: targetConfig.year,
        semester: targetConfig.semester,
        name: `${cleanData.name} (نسخة)`
      }]);
      if (error) throw error;
      alert("تم نسخ الطالب بنجاح.");
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert("فشل النسخ: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const payload = { 
        ...form, 
        agreed_amount: parseFloat(form.agreed_amount),
        price_per_hour: parseFloat(form.price_per_hour),
        teacher_id: profile.id 
      };
      
      if (selectedStudent) {
        await supabase.from('students').update(payload).eq('id', selectedStudent.id);
      } else {
        await supabase.from('students').insert([payload]);
      }
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert("خطأ: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const groupedStudents = useMemo(() => {
    return students.reduce((acc, s) => {
      if (!acc[s.grade]) acc[s.grade] = [];
      acc[s.grade].push(s);
      return acc;
    }, {} as any);
  }, [students]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header & Main Actions */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] border shadow-sm flex flex-col gap-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6 text-right">
            <div className="bg-indigo-600 p-5 rounded-[2.2rem] text-white shadow-xl shadow-indigo-100"><Users size={32} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة الطلاب والعمليات</h2>
              <p className="text-slate-400 font-bold text-sm">الفترة: <span className="text-indigo-600 font-black">{year} | فصل {semester}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => { setSelectedStudent(null); setForm({ ...form, academic_year: year, semester: semester }); setActiveModal('edit'); }} className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
               <Plus size={20} /> إضافة طالب جديد
             </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
           <div className="relative flex-1 w-full">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input placeholder="البحث في الأسماء..." className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>

           {selectedIds.length > 0 && (
             <div className="flex items-center gap-3 bg-indigo-600 p-2 rounded-[2.5rem] shadow-xl animate-in zoom-in border border-indigo-500">
                <span className="px-6 font-black text-white text-xs">محدد ({selectedIds.length})</span>
                <button onClick={() => setActiveModal('move')} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all" title="نقل جماعي للفترة"><MoveRight size={20} /></button>
                <button onClick={handleBulkDelete} className="p-4 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 shadow-lg transition-all" title="حذف جماعي نهائي"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedIds([])} className="p-4 text-white/50 hover:text-white transition-all"><X size={20} /></button>
             </div>
           )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[100px] -z-10 rounded-full"></div>
      </div>

      {/* Grade List */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-24 text-center">
             <RefreshCw className="w-16 h-16 text-indigo-100 animate-spin mx-auto mb-6" />
             <p className="font-black text-slate-400 text-sm tracking-widest uppercase">جاري فتح السجلات الماسية...</p>
          </div>
        ) : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => {
            const gradeStds = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStds.length === 0) return null;
            
            const allGradeSelected = gradeStds.every((s: any) => selectedIds.includes(s.id));

            return (
              <div key={grade} className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
                <div className="flex flex-col md:flex-row items-center justify-between p-10 hover:bg-slate-50/50 transition-all group border-b border-slate-50">
                   <div className="flex items-center gap-6">
                      <button onClick={() => selectAllInGrade(gradeStds)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${allGradeSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                         <CheckSquare size={24} />
                      </button>
                      <div className="text-right">
                         <h3 className="text-2xl font-black text-slate-900 leading-none">طلاب الصف {grade}</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">إجمالي المجلد: {gradeStds.length} سجل</p>
                      </div>
                   </div>
                   <button onClick={() => setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                      <ChevronDown className={`transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180' : ''}`} size={24} />
                   </button>
                </div>

                {expandedGrades.includes(grade) && (
                  <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-slate-50/30 animate-in slide-in-from-top-4 duration-500">
                    {gradeStds.map((s: any) => (
                      <div key={s.id} className={`p-8 rounded-[3.5rem] border-2 transition-all relative group text-right ${selectedIds.includes(s.id) ? 'border-indigo-600 bg-white shadow-2xl scale-[1.02]' : 'border-transparent bg-white hover:shadow-xl'}`}>
                        
                        <button onClick={() => toggleSelection(s.id)} className="absolute top-8 left-8 p-2 transition-all z-10">
                           {selectedIds.includes(s.id) ? <CheckCircle2 className="text-indigo-600" size={28} /> : <Square className="text-slate-100 group-hover:text-indigo-200" size={28} />}
                        </button>

                        <div className="flex items-center gap-5 mb-10">
                           <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg group-hover:bg-indigo-600 transition-all">
                              {s.name[0]}
                           </div>
                           <div className="flex-1 min-w-0 pr-2">
                              <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{s.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{s.group_name || 'طلاب فردي'}</p>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <button onClick={() => { setSelectedStudent(s); setForm({ ...s, agreed_amount: s.agreed_amount.toString(), price_per_hour: s.price_per_hour.toString() }); setActiveModal('edit'); }} className="flex-1 py-4 bg-slate-50 text-indigo-600 rounded-2xl font-black text-[10px] hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={16} /> تعديل</button>
                           <button onClick={() => { setSelectedStudent(s); setActiveModal('copy'); }} className="flex-1 py-4 bg-slate-50 text-emerald-600 rounded-2xl font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all"><Copy size={16} /> نسخ</button>
                           <button onClick={() => handleIndividualDelete(s.id, s.name)} className="p-4 bg-rose-50 text-rose-300 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Modals */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl">
           <div className="bg-white w-full max-w-3xl p-12 rounded-[5rem] shadow-2xl space-y-10 animate-in zoom-in text-right max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <h3 className="text-3xl font-black text-slate-900">{selectedStudent ? 'تحديث بيانات الطالب' : 'إضافة طالب ماسي'}</h3>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-50 rounded-full hover:text-rose-500 transition-all"><X size={28}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">الاسم بالكامل</label>
                    <input className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-lg outline-none focus:ring-4 ring-indigo-50" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">الصف الدراسي</label>
                    <select className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-black text-lg outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       {[...Array(12)].map((_, i) => <option key={i} value={`${i+1}`}>الصف {i+1}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">المبلغ المتفق عليه ($)</label>
                    <input type="number" className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-lg outline-none" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">اسم المجموعة / العبارة</label>
                    <input className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-lg outline-none" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} placeholder="مثلاً: السبت 4 عصراً" />
                 </div>
              </div>

              <button onClick={handleSave} disabled={isProcessing} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-5">
                 {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={32} />} حفظ السجل النهائي
              </button>
           </div>
        </div>
      )}

      {(activeModal === 'move' || activeModal === 'copy') && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl text-center space-y-10 animate-in zoom-in">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                 {activeModal === 'move' ? <MoveRight size={48} /> : <Copy size={48} />}
              </div>
              <div className="space-y-3">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{activeModal === 'move' ? 'نقل الطلاب' : 'نسخ الطالب'}</h3>
                 <p className="text-slate-400 font-bold text-sm">اختر الفترة الدراسية المستهدفة للعملية:</p>
              </div>
              <div className="space-y-4 text-right">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-4">السنة الدراسية</label>
                    <select className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none" value={targetConfig.year} onChange={e => setTargetConfig({...targetConfig, year: e.target.value})}>
                       <option value="2024-2025">2024-2025</option><option value="2025-2026">2025-2026</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mr-4">الفصل الدراسي</label>
                    <select className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none" value={targetConfig.semester} onChange={e => setTargetConfig({...targetConfig, semester: e.target.value})}>
                       <option value="1">الفصل الأول</option><option value="2">الفصل الثاني</option>
                    </select>
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black">إلغاء</button>
                 <button onClick={activeModal === 'move' ? handleBulkMove : () => handleDuplicate(selectedStudent)} disabled={isProcessing} className="flex-[2] py-6 bg-indigo-600 text-white rounded-3xl font-black shadow-xl disabled:opacity-50">
                    {isProcessing ? 'جاري التنفيذ...' : (activeModal === 'move' ? 'نقل الآن' : 'تأكيد النسخ')}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
