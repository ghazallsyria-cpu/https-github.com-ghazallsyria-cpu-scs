
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, Copy, MoveRight, CheckSquare, Square, MoreVertical, 
  UserMinus, UserCheck, AlertCircle, FileStack
} from 'lucide-react';

const Students = ({ isAdmin, profile, year, semester }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'edit' | 'migrate' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [migrationConfig, setMigrationConfig] = useState({
    targetYear: '2025-2026', targetSemester: '1'
  });

  const [form, setForm] = useState({
    name: '', grade: '12', group_name: '', address: '', academic_year: year, semester: semester,
    agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', profile.id);
      
      const { data, error } = await query.order('grade', { ascending: false }).order('name');
      if (error) throw error;
      setStudents(data || []);
      
      const grades: string[] = Array.from(new Set((data || []).map((s: any) => String(s.grade))));
      setExpandedGrades(grades);
      setSelectedIds([]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [isAdmin, profile.id, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} طلاب نهائياً؟`)) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', selectedIds);
      if (error) throw error;
      fetchStudents();
    } catch (err: any) { alert("خطأ في الحذف الجماعي: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleDuplicate = async (student: any) => {
    if (!confirm(`هل تريد نسخ الطالب "${student.name}" إلى فترة أخرى؟`)) return;
    setIsProcessing(true);
    try {
      const payload = { ...student, id: undefined, created_at: undefined, academic_year: '2025-2026', semester: '1' };
      delete payload.total_lessons; delete payload.total_paid; delete payload.remaining_balance;
      
      const { error } = await supabase.from('students').insert([payload]);
      if (error) throw error;
      alert("تم النسخ بنجاح إلى 2025-2026");
    } catch (err: any) { alert("فشل النسخ: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleBulkMove = async () => {
    if (selectedIds.length === 0) return;
    const targetYear = prompt("السنة الدراسية المستهدفة (مثلاً 2025-2026):", "2025-2026");
    const targetSem = prompt("الفصل الدراسي المستهدف (1 أو 2):", "1");
    if (!targetYear || !targetSem) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students').update({ academic_year: targetYear, semester: targetSem }).in('id', selectedIds);
      if (error) throw error;
      fetchStudents();
      alert("تم نقل الطلاب بنجاح.");
    } catch (err: any) { alert("فشل النقل الجماعي: " + err.message); }
    finally { setIsProcessing(false); }
  };

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      const payload = { 
        name: form.name, grade: form.grade, group_name: form.group_name, address: form.address,
        academic_year: year, semester: semester,
        agreed_amount: parseFloat(form.agreed_amount || '0'),
        is_hourly: form.is_hourly, price_per_hour: parseFloat(form.price_per_hour || '0'),
        phones: form.phones, teacher_id: profile.id
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

  const gradeOptions = [...Array(12)].map((_, i) => ({ value: `${i + 1}`, label: `الصف ${i + 1}` }));

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header with Search and Bulk Actions */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] border shadow-sm flex flex-col gap-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6 text-right">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Users size={32} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة ملفات الطلاب</h2>
              <p className="text-slate-400 font-bold text-sm">الفترة: <span className="text-indigo-600 font-black">{year} - فصل {semester}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => setActiveModal('edit')} className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
               <Plus size={20} /> إضافة جديد
             </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="relative flex-1 w-full">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input placeholder="البحث بالاسم..." className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>

           {selectedIds.length > 0 && (
             <div className="flex items-center gap-3 bg-indigo-50 p-2 rounded-[2.5rem] border border-indigo-100 animate-in zoom-in">
                <span className="px-6 font-black text-indigo-600 text-sm">محدد ({selectedIds.length})</span>
                <button onClick={handleBulkMove} className="p-4 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white shadow-sm transition-all" title="نقل جماعي"><MoveRight size={20} /></button>
                <button onClick={handleBulkDelete} className="p-4 bg-white text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white shadow-sm transition-all" title="حذف جماعي"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedIds([])} className="p-4 text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
             </div>
           )}
        </div>
      </div>

      {/* Grade List */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-24 text-center">
             <RefreshCw className="w-16 h-16 text-indigo-100 animate-spin mx-auto mb-6" />
             <p className="font-black text-slate-400 text-sm tracking-widest uppercase">جاري فتح ملفات القمة...</p>
          </div>
        ) : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => {
            const gradeStds = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStds.length === 0) return null;
            return (
              <div key={grade} className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])} className="w-full p-10 flex items-center justify-between hover:bg-slate-50 transition-all group">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Folder size={28} fill="currentColor" />
                      </div>
                      <div className="text-right">
                         <h3 className="text-2xl font-black text-slate-900 leading-none">طلاب الصف {grade}</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">الإجمالي: {gradeStds.length} طلاب</p>
                      </div>
                   </div>
                   <ChevronDown className={`text-slate-200 transition-transform ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={32} />
                </button>

                {expandedGrades.includes(grade) && (
                  <div className="p-10 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gradeStds.map((s: any) => (
                      <div key={s.id} className={`p-8 rounded-[3.5rem] border-2 transition-all relative group text-right ${selectedIds.includes(s.id) ? 'border-indigo-600 bg-indigo-50/30 shadow-xl' : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-2xl'}`}>
                        
                        <button onClick={() => toggleSelection(s.id)} className="absolute top-8 left-8 p-3 rounded-xl transition-all z-10">
                           {selectedIds.includes(s.id) ? <CheckSquare className="text-indigo-600" size={24} /> : <Square className="text-slate-300 group-hover:text-indigo-400" size={24} />}
                        </button>

                        <div className="flex items-center gap-5 mb-10">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm transition-all group-hover:scale-110">
                              {s.name[0]}
                           </div>
                           <div className="flex-1 min-w-0 pr-8">
                              <h4 className="text-xl font-black text-slate-900 leading-tight truncate">{s.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{s.group_name || 'فردي'}</p>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <button onClick={() => {setSelectedStudent(s); setForm({ ...s, agreed_amount: s.agreed_amount.toString(), price_per_hour: s.price_per_hour.toString() }); setActiveModal('edit');}} className="flex-1 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] shadow-sm flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={16} /> تعديل</button>
                           <button onClick={() => handleDuplicate(s)} className="flex-1 py-4 bg-white text-emerald-600 rounded-2xl font-black text-[10px] shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"><Copy size={16} /> نسخ</button>
                           <button onClick={async () => {if(confirm("حذف الطالب؟")) { await supabase.from('students').delete().eq('id', s.id); fetchStudents(); }}} className="p-4 bg-white text-rose-300 rounded-2xl hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Edit Modal */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl">
           <div className="bg-white w-full max-w-3xl p-12 rounded-[5rem] shadow-2xl space-y-10 animate-in zoom-in text-right overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-50 pb-10">
                 <h3 className="text-3xl font-black text-slate-900">{selectedStudent ? 'تعديل السجل الماسي' : 'إضافة سجل طلابي جديد'}</h3>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-50 rounded-full hover:text-rose-500 transition-all"><X size={28}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">اسم الطالب</label>
                    <input className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold text-lg outline-none focus:ring-4 ring-indigo-50" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">المرحلة</label>
                    <select className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2.5rem] font-black text-lg outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                 </div>
              </div>

              <button onClick={handleAction} disabled={isProcessing} className="w-full py-8 bg-slate-900 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-5">
                 {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={32} />} حفظ البيانات النهائية
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
