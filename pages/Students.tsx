
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, 
  Trash2, Edit3, X, Save, RefreshCw, ChevronDown, DollarSign, Clock, Hash
} from 'lucide-react';

const Students = ({ isAdmin, profile }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'edit' | 'confirm_delete' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [form, setForm] = useState({
    name: '', grade: '12', group_name: '', address: '', academic_year: '2024-2025', semester: '1',
    agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*');
      if (!isAdmin) query = query.eq('teacher_id', profile.id);
      
      const { data, error } = await query.order('grade', { ascending: false }).order('name');
      if (error) throw error;
      setStudents(data || []);
      
      const grades: string[] = Array.from(new Set((data || []).map((s: any) => String(s.grade))));
      setExpandedGrades(grades);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, profile.id]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
  };

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      const payload = { 
        name: form.name, grade: form.grade, group_name: form.group_name, address: form.address,
        academic_year: form.academic_year, semester: form.semester,
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (type: 'edit', student: any = null) => {
    setSelectedStudent(student);
    if (student) {
      setForm({
        name: student.name, grade: student.grade, group_name: student.group_name || '', address: student.address, 
        academic_year: student.academic_year, semester: student.semester, 
        agreed_amount: (student.agreed_amount || 0).toString(),
        is_hourly: student.is_hourly, price_per_hour: (student.price_per_hour || 0).toString(),
        phones: student.phones || [{number: '', label: 'الطالب'}]
      });
    } else {
      setForm({
        name: '', grade: '12', group_name: '', address: '', academic_year: '2024-2025', semester: '1',
        agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
      });
    }
    setActiveModal(type);
  };

  const groupedStudents = students.reduce((acc, s) => {
    if (!acc[s.grade]) acc[s.grade] = [];
    acc[s.grade].push(s);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-8 pb-32">
      <div className="bg-white p-10 rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg"><Users size={28} /></div>
          <div><h2 className="text-2xl font-black">إدارة <span className="text-indigo-600">الطلاب</span></h2><p className="text-slate-400 font-bold text-sm">تنظيم الطلاب مالياً ودراسياً.</p></div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
             <input placeholder="بحث باسم الطالب..." className="w-full pr-10 pl-4 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => openModal('edit')} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-600 transition-all">
             <Plus size={20} /> إضافة طالب
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-indigo-600" size={40} /></div>
        ) : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => {
            const gradeStudents = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStudents.length === 0) return null;
            return (
                <div key={grade} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => toggleGrade(grade)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Folder size={24} fill="currentColor" /></div>
                            <div className="text-right">
                                <h3 className="text-xl font-black text-slate-900">طلاب الصف {grade}</h3>
                                <p className="text-xs font-bold text-slate-400">إجمالي الطلاب: {gradeStudents.length}</p>
                            </div>
                        </div>
                        <ChevronDown className={`text-slate-300 transition-transform ${expandedGrades.includes(grade) ? 'rotate-180' : ''}`} size={24} />
                    </button>
                    {expandedGrades.includes(grade) && (
                        <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gradeStudents.map((s: any) => (
                                <div key={s.id} className="p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{s.name[0]}</div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openModal('edit', s)} className="p-2 bg-white text-slate-400 rounded-lg hover:text-indigo-600"><Edit3 size={14} /></button>
                                            <button onClick={() => { setSelectedStudent(s); setActiveModal('confirm_delete'); }} className="p-2 bg-white text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 mb-1">{s.name}</h4>
                                    <div className="flex gap-2">
                                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{s.group_name || 'بدون مجموعة'}</span>
                                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.is_hourly ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                          {s.is_hourly ? `نظام ساعة ($${s.price_per_hour})` : `مقطوع ($${s.agreed_amount})`}
                                       </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-2xl p-8 rounded-[3rem] shadow-2xl space-y-6 animate-in zoom-in overflow-y-auto max-h-[90vh] text-right">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-2xl font-black">{selectedStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                 <button onClick={() => setActiveModal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs font-black text-slate-500">اسم الطالب</label><input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-xs font-black text-slate-500">الصف</label>
                  <select className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="12">الثاني عشر</option><option value="11">الحادي عشر</option><option value="10">العاشر</option>
                  </select>
                </div>
                <div className="space-y-1"><label className="text-xs font-black text-slate-500">المجموعة (المجلد)</label><input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-xs font-black text-slate-500">الهاتف</label><input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none text-left" value={form.phones[0].number} onChange={e => {
                  const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                }} /></div>
              </div>

              <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-6">
                 <h4 className="font-black text-indigo-600 flex items-center gap-2"><DollarSign size={18} /> الإعدادات المالية</h4>
                 <div className="flex gap-4">
                    <button type="button" onClick={() => setForm({...form, is_hourly: false})} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${!form.is_hourly ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}><Hash size={14} /> مبلغ مقطوع</button>
                    <button type="button" onClick={() => setForm({...form, is_hourly: true})} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${form.is_hourly ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400'}`}><Clock size={14} /> بنظام الساعة</button>
                 </div>
                 
                 {form.is_hourly ? (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                       <label className="text-xs font-black text-slate-500">سعر الساعة الواحدة ($)</label>
                       <input type="number" className="w-full p-4 bg-white rounded-xl font-bold border-none shadow-sm" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                    </div>
                 ) : (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                       <label className="text-xs font-black text-slate-500">المبلغ الإجمالي للفصل ($)</label>
                       <input type="number" className="w-full p-4 bg-white rounded-xl font-bold border-none shadow-sm" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                    </div>
                 )}
              </div>

              <button onClick={handleAction} disabled={isProcessing} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={20} />} حفظ البيانات المالية والدراسية
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
