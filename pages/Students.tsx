
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, DollarSign, Clock, Hash, GraduationCap, 
  MoveRight, CheckSquare, Square, AlertTriangle
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
    targetYear: '2025-2026', targetSemester: '1', copyFinancials: false, copyLessons: false
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

  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
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
        const { error } = await supabase.from('students').insert([payload]);
        if (error) throw error;
      }
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert("حدث خطأ في التسجيل: " + err.message); }
    finally { setIsProcessing(false); }
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
        name: '', grade: '12', group_name: '', address: '', academic_year: year, semester: semester,
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

  // تحديث خيارات المراحل الدراسية من 1 إلى 12
  const gradeOptions = [...Array(12)].map((_, i) => ({ value: `${i + 1}`, label: `الصف ${i + 1}` }));

  return (
    <div className="space-y-12 animate-diamond">
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6 text-right">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Users size={32} /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة الطلاب</h2>
            <p className="text-slate-400 font-bold text-sm">الفترة الحالية: <span className="text-indigo-600 font-black">{year} - فصل {semester}</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
             <input placeholder="بحث في هذه الفترة..." className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold focus:ring-4 ring-indigo-50 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => openModal('edit')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
             <Plus size={20} /> إضافة طالب جديد
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="py-24 text-center">
             <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
             <p className="font-black text-slate-400 text-sm tracking-widest uppercase">جاري جلب ملفات الطلاب...</p>
          </div>
        ) : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => {
            const gradeStudents = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStudents.length === 0) return null;
            return (
                <div key={grade} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => toggleGrade(grade)} className="w-full p-10 flex items-center justify-between hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                               <Folder size={28} fill="currentColor" />
                            </div>
                            <div className="text-right">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">طلاب الصف {grade}</h3>
                                <p className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full mt-2 inline-block">التعداد: {gradeStudents.length} طلاب</p>
                            </div>
                        </div>
                        <ChevronDown className={`text-slate-200 transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={32} />
                    </button>
                    
                    {expandedGrades.includes(grade) && (
                        <div className="p-10 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                            {gradeStudents.map((s: any) => (
                                <div key={s.id} className="p-8 rounded-[3.5rem] border bg-slate-50 border-transparent hover:bg-white hover:shadow-2xl transition-all relative group text-right">
                                    <div className="flex items-center gap-5 mb-10">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white">
                                           {s.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                           <h4 className="text-xl font-black text-slate-900 leading-tight truncate">{s.name}</h4>
                                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-white px-3 py-1 rounded-full border border-slate-100">{s.group_name || 'طلاب فردي'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                       <button onClick={() => openModal('edit', s)} className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"><Edit3 size={16} /> تعديل</button>
                                       <button onClick={async () => {
                                          if (confirm("هل أنت متأكد من حذف الطالب؟")) {
                                             await supabase.from('students').delete().eq('id', s.id);
                                             fetchStudents();
                                          }
                                       }} className="flex-1 py-4 bg-white text-rose-300 rounded-2xl font-black text-[10px] hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"><Trash2 size={16} /> حذف</button>
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
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
           <div className="bg-white w-full max-w-3xl p-12 rounded-[5rem] shadow-2xl space-y-10 animate-in zoom-in text-right overflow-y-auto max-h-[95vh] no-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-50 pb-10">
                 <div className="flex items-center gap-6">
                    <div className="bg-indigo-50 p-5 rounded-3xl text-indigo-600"><GraduationCap size={40}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 leading-tight">{selectedStudent ? 'تعديل ملف الطالب' : 'إضافة ملف طالب جديد'}</h3>
                       <p className="text-slate-400 font-bold text-sm">الفترة المستهدفة: <span className="text-indigo-600 font-black">{year} - فصل {semester}</span></p>
                    </div>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={28}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">الاسم الكامل</label>
                   <input required className="w-full px-8 py-6 bg-slate-50 rounded-[2.5rem] font-bold border-none shadow-inner outline-none focus:ring-4 ring-indigo-50 transition-all text-lg" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">المرحلة الدراسية</label>
                   <select className="w-full px-8 py-6 bg-slate-50 rounded-[2.5rem] font-black border-none focus:ring-4 ring-indigo-50 outline-none text-lg cursor-pointer" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">هاتف التواصل</label>
                   <input type="tel" className="w-full px-8 py-6 bg-slate-50 rounded-[2.5rem] font-bold border-none shadow-inner text-left outline-none transition-all" value={form.phones[0].number} onChange={e => {
                      const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                   }} />
                </div>
              </div>

              <div className="flex gap-4 pb-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-7 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black text-xl hover:bg-slate-200 transition-all">تراجع</button>
                 <button onClick={handleAction} disabled={isProcessing} className="flex-[2] py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-5">
                   {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={32} />} حفظ السجل الماسي
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
