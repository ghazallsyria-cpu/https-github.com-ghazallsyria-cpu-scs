
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, Copy, MoveRight, CheckSquare, Square, CheckCircle2
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
  const [targetConfig, setTargetConfig] = useState({ year: year, semester: semester });

  const [form, setForm] = useState({
    name: '', grade: '12', group_name: '', address: '', academic_year: year, semester: semester,
    agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('students').select('*').eq('academic_year', year).eq('semester', semester);
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
    if (!confirm(`حذف ${selectedIds.length} طلاب نهائياً؟`)) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', selectedIds);
      if (error) throw error;
      fetchStudents();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleDuplicate = async (student: any) => {
    setIsProcessing(true);
    try {
      const { id, created_at, ...cleanData } = student;
      await supabase.from('students').insert([{
        ...cleanData,
        academic_year: targetConfig.year,
        semester: targetConfig.semester,
        name: `${cleanData.name} (نسخة)`
      }]);
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleBulkMove = async () => {
    setIsProcessing(true);
    try {
      await supabase.from('students').update({ academic_year: targetConfig.year, semester: targetConfig.semester }).in('id', selectedIds);
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert(err.message); }
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Search & Actions Bar */}
      <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border shadow-sm flex flex-col gap-6 relative">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Users size={24} /></div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter">إدارة الطلاب <span className="text-[10px] block text-slate-400 font-bold">{year} - فصل {semester}</span></h2>
           </div>
           <button onClick={() => { setSelectedStudent(null); setActiveModal('edit'); }} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl"><Plus size={20} /></button>
        </div>

        <div className="relative">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input placeholder="البحث..." className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* Floating Bulk Actions for Mobile & Desktop */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-32 lg:bottom-10 left-1/2 -translate-x-1/2 z-[1100] bg-indigo-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in zoom-in">
             <span className="font-black text-xs whitespace-nowrap">{selectedIds.length} طلاب</span>
             <div className="flex gap-2 border-r border-white/20 pr-4">
                <button onClick={() => setActiveModal('move')} className="p-3 bg-white/10 rounded-full hover:bg-white/20" title="نقل"><MoveRight size={18} /></button>
                <button onClick={handleBulkDelete} className="p-3 bg-rose-500 rounded-full hover:bg-rose-600" title="حذف"><Trash2 size={18} /></button>
                <button onClick={() => setSelectedIds([])} className="p-3 hover:text-white/50"><X size={18} /></button>
             </div>
          </div>
        )}
      </div>

      {/* Grade Folders */}
      <div className="space-y-4">
        {loading ? <div className="p-20 text-center animate-pulse font-black text-slate-300">جاري فتح المجلدات...</div> : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => {
            const gradeStds = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStds.length === 0) return null;
            return (
              <div key={grade} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <button onClick={() => setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                   <div className="flex items-center gap-4">
                      <Folder size={24} className="text-indigo-600" fill="currentColor" />
                      <div className="text-right"><h3 className="font-black text-slate-900">الصف {grade}</h3><p className="text-[9px] font-bold text-slate-400">إجمالي: {gradeStds.length}</p></div>
                   </div>
                   <ChevronDown className={`text-slate-200 transition-transform ${expandedGrades.includes(grade) ? 'rotate-180' : ''}`} size={20} />
                </button>
                {expandedGrades.includes(grade) && (
                  <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradeStds.map((s: any) => (
                      <div key={s.id} className={`p-6 rounded-[2rem] border-2 transition-all relative ${selectedIds.includes(s.id) ? 'border-indigo-600 bg-indigo-50/20' : 'bg-slate-50 border-transparent'}`}>
                        <button onClick={() => toggleSelection(s.id)} className="absolute top-4 left-4 p-2">{selectedIds.includes(s.id) ? <CheckCircle2 className="text-indigo-600" size={20} /> : <Square className="text-slate-200" size={20} />}</button>
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{s.name[0]}</div>
                           <h4 className="font-black text-slate-900 truncate flex-1 pr-2">{s.name}</h4>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setSelectedStudent(s); setForm({...s}); setActiveModal('edit'); }} className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] shadow-sm hover:bg-indigo-600 hover:text-white transition-all">تعديل</button>
                           <button onClick={() => { setSelectedStudent(s); setActiveModal('copy'); }} className="flex-1 py-3 bg-white text-emerald-600 rounded-xl font-black text-[10px] shadow-sm hover:bg-emerald-600 hover:text-white transition-all">نسخ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Shared Target Modal (For Move/Copy) */}
      {(activeModal === 'move' || activeModal === 'copy') && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl text-center space-y-6 animate-in zoom-in">
              <h3 className="text-2xl font-black">{activeModal === 'move' ? 'نقل الطلاب' : 'نسخ السجل'}</h3>
              <div className="space-y-4 text-right">
                 <select className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none" value={targetConfig.year} onChange={e => setTargetConfig({...targetConfig, year: e.target.value})}><option value="2024-2025">2024-2025</option><option value="2025-2026">2025-2026</option></select>
                 <select className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none" value={targetConfig.semester} onChange={e => setTargetConfig({...targetConfig, semester: e.target.value})}><option value="1">فصل 1</option><option value="2">فصل 2</option></select>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-100 font-black rounded-2xl">إلغاء</button>
                 <button onClick={activeModal === 'move' ? handleBulkMove : () => handleDuplicate(selectedStudent)} disabled={isProcessing} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">{isProcessing ? 'جاري التنفيذ...' : 'تأكيد'}</button>
              </div>
           </div>
        </div>
      )}

      {/* Edit/Add Modal - Simplified */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl overflow-y-auto">
           <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl space-y-6 my-auto">
              <div className="flex justify-between items-center border-b pb-4"><h3 className="text-xl font-black">{selectedStudent ? 'تعديل طالب' : 'طالب جديد'}</h3><button onClick={() => setActiveModal(null)} className="p-2 bg-slate-50 rounded-full"><X size={20}/></button></div>
              <div className="space-y-4">
                 <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="الاسم" />
                 <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} placeholder="المبلغ المتفق عليه" type="number" />
              </div>
              <button onClick={async () => { 
                setIsProcessing(true); 
                const payload = {...form, agreed_amount: parseFloat(form.agreed_amount), teacher_id: profile.id};
                if(selectedStudent) await supabase.from('students').update(payload).eq('id', selectedStudent.id);
                else await supabase.from('students').insert([payload]);
                setActiveModal(null); fetchStudents(); setIsProcessing(false);
              }} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl">حفظ السجل</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
