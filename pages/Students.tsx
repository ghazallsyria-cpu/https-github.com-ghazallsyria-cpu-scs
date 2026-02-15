
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, Copy, MoveRight, CheckCircle2, Square,
  Phone, MapPin, DollarSign, GraduationCap, School, UserPlus, Filter
} from 'lucide-react';
import { Student, StudentPhone } from '../types';

const Students = ({ isAdmin, profile, year, semester }: any) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'edit' | 'move' | 'copy' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetConfig, setTargetConfig] = useState({ year: year, semester: semester });

  // Initial Form State
  const defaultPhones: StudentPhone[] = [{number: '', label: 'طالب'}, {number: '', label: 'ولي أمر'}];
  const [form, setForm] = useState({
    name: '', 
    grade: '12', 
    group_name: '', 
    address: '', 
    academic_year: year, 
    semester: semester,
    agreed_amount: '0', 
    is_hourly: false, 
    price_per_hour: '0', 
    phones: defaultPhones
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      
      // Admin sees all, Teacher sees theirs
      if (!isAdmin) {
        query = query.eq('teacher_id', profile.id);
      }
      
      const { data, error } = await query.order('grade', { ascending: false }).order('name');
      if (error) throw error;
      
      // Safe casting
      const fetchedStudents: Student[] = (data || []).map((s: any) => ({
        ...s,
        phones: Array.isArray(s.phones) ? s.phones : [] // Ensure phones is always an array
      }));

      setStudents(fetchedStudents);
      
      // Auto expand folders
      const grades = Array.from(new Set(fetchedStudents.map(s => String(s.grade))));
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
    if (!confirm(`تحذير: هل أنت متأكد من حذف ${selectedIds.length} طالب نهائياً؟ ستفقد جميع السجلات المالية والأكاديمية المرتبطة بهم.`)) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('students').delete().in('id', selectedIds);
      if (error) throw error;
      fetchStudents();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleSaveStudent = async () => {
    if (!form.name) return alert("يرجى إدخال اسم الطالب");
    setIsProcessing(true);
    try {
      // Prepare payload
      const payload = {
        name: form.name,
        grade: form.grade,
        group_name: form.group_name,
        address: form.address,
        academic_year: form.academic_year,
        semester: form.semester,
        agreed_amount: parseFloat(form.agreed_amount) || 0,
        is_hourly: form.is_hourly,
        price_per_hour: parseFloat(form.price_per_hour) || 0,
        phones: form.phones.filter(p => p.number.trim() !== ''), // Filter empty phones
        teacher_id: selectedStudent ? selectedStudent.teacher_id : profile.id // Preserve original teacher or set to current
      };

      let error;
      if (selectedStudent) {
        const { error: err } = await supabase.from('students').update(payload).eq('id', selectedStudent.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('students').insert([payload]);
        error = err;
      }

      if (error) throw error;
      
      setActiveModal(null);
      fetchStudents();
      setForm({...form, name: '', group_name: '', phones: defaultPhones, agreed_amount: '0'});
    } catch (err: any) {
      alert("خطأ في الحفظ: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (student: Student | null) => {
    setSelectedStudent(student);
    if (student) {
      setForm({
        name: student.name,
        grade: student.grade,
        group_name: student.group_name || '',
        address: student.address || '',
        academic_year: student.academic_year,
        semester: student.semester,
        agreed_amount: String(student.agreed_amount),
        is_hourly: student.is_hourly,
        price_per_hour: String(student.price_per_hour),
        phones: (student.phones && student.phones.length > 0) ? student.phones : defaultPhones
      });
    } else {
      setForm({
        name: '', grade: '12', group_name: '', address: '',
        academic_year: year, semester: semester,
        agreed_amount: '0', is_hourly: false, price_per_hour: '0',
        phones: defaultPhones
      });
    }
    setActiveModal('edit');
  };

  const updatePhone = (index: number, field: keyof StudentPhone, value: string) => {
    const newPhones = [...form.phones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setForm({ ...form, phones: newPhones });
  };

  const groupedStudents = useMemo(() => {
    return students.reduce((acc, s) => {
      const g = s.grade || 'غير محدد';
      if (!acc[g]) acc[g] = [];
      acc[g].push(s);
      return acc;
    }, {} as Record<string, Student[]>);
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Bar */}
      <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-50"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-5">
              <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl shadow-slate-200"><Users size={28} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">سجلات الطلاب</h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full mt-1 inline-block border border-slate-100">{year} - فصل {semester}</span>
              </div>
           </div>
           
           <button onClick={() => openEditModal(null)} className="group bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-3 active:scale-95">
              <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform"><Plus size={18} /></div>
              <span className="font-black text-sm">تسجيل طالب</span>
           </button>
        </div>

        <div className="relative">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
           <input 
            placeholder="ابحث باسم الطالب، المجموعة، أو رقم الهاتف..." 
            className="w-full pr-14 pl-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-50 transition-all text-slate-600" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
           />
        </div>

        {/* Floating Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 border border-white/10">
             <div className="flex items-center gap-2 border-l border-white/10 pl-6 ml-2">
                <span className="bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{selectedIds.length}</span>
                <span className="font-bold text-xs">طالب محدد</span>
             </div>
             <div className="flex gap-2">
                <button onClick={handleBulkDelete} className="p-2.5 bg-rose-500 rounded-full hover:bg-rose-600 transition-colors" title="حذف المحدد"><Trash2 size={18} /></button>
                <button onClick={() => setSelectedIds([])} className="p-2.5 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
             </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {loading ? (
            <div className="p-32 text-center">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="font-black text-slate-300 text-sm tracking-widest">جاري مزامنة قاعدة البيانات...</p>
            </div>
        ) : Object.keys(groupedStudents).sort((a,b) => isNaN(Number(a)) ? 1 : Number(b)-Number(a)).map(grade => {
            const gradeStds = groupedStudents[grade].filter(s => s.name.includes(searchTerm) || (s.group_name && s.group_name.includes(searchTerm)));
            if (gradeStds.length === 0) return null;
            
            return (
              <div key={grade} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group">
                <button onClick={() => setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])} className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-all">
                   <div className="flex items-center gap-6">
                      <div className="bg-indigo-50 text-indigo-600 p-4 rounded-[1.2rem] shadow-inner"><Folder size={24} fill="currentColor" /></div>
                      <div className="text-right">
                          <h3 className="text-xl font-black text-slate-900">الصف {grade}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{gradeStds.length} ملفات</p>
                      </div>
                   </div>
                   <ChevronDown className={`text-slate-300 transition-transform duration-300 ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={24} />
                </button>
                
                {expandedGrades.includes(grade) && (
                  <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                    {gradeStds.map((s) => (
                      <div key={s.id} className={`p-6 rounded-[2.5rem] border transition-all relative group/card ${selectedIds.includes(s.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl'}`}>
                        <button onClick={() => toggleSelection(s.id)} className="absolute top-6 left-6 z-10 opacity-100 lg:opacity-0 group-hover/card:opacity-100 transition-opacity">
                            {selectedIds.includes(s.id) ? <CheckCircle2 className="text-indigo-600 fill-indigo-100" size={24} /> : <Square className="text-slate-200" size={24} />}
                        </button>
                        
                        <div className="flex items-center gap-5 mb-6">
                           <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-[1.2rem] flex items-center justify-center font-black text-indigo-600 text-xl shadow-sm">
                              {s.name[0]}
                           </div>
                           <div className="flex-1 min-w-0 pr-1">
                               <h4 className="font-black text-slate-900 truncate text-lg">{s.name}</h4>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{s.group_name || 'فردي'}</span>
                                  {s.remaining_balance && s.remaining_balance > 0 ? (
                                      <span className="text-[9px] font-bold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-md">مدين</span>
                                  ) : null}
                               </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                                <span className="text-[9px] font-black text-slate-400 block mb-1">المتفق عليه</span>
                                <span className="font-black text-slate-900">${s.agreed_amount}</span>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                                <span className="text-[9px] font-black text-slate-400 block mb-1">المتبقي</span>
                                <span className={`font-black ${s.remaining_balance && s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ${s.remaining_balance || 0}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                           <button onClick={() => openEditModal(s)} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-100">
                               <Edit3 size={14} /> تعديل
                           </button>
                           <button onClick={() => { setSelectedStudent(s); setActiveModal('copy'); }} className="px-4 py-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-emerald-600 hover:border-emerald-200 transition-all">
                               <Copy size={16} />
                           </button>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl overflow-y-auto">
           <div className="bg-white w-full max-w-2xl p-8 md:p-10 rounded-[3.5rem] shadow-2xl space-y-8 my-auto animate-in zoom-in duration-300 relative border border-white/20">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><UserPlus size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedStudent ? 'تعديل الملف' : 'طالب جديد'}</h3>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto no-scrollbar px-1">
                 {/* Basic Info */}
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-500 px-3">الاسم الكامل</label>
                    <input className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none focus:ring-2 ring-indigo-100 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="الاسم كما في الكشوفات" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 px-3">الصف الدراسي</label>
                    <select className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none cursor-pointer" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       {[...Array(12)].map((_, i) => <option key={i} value={`${i+1}`}>{i+1}</option>)}
                       <option value="13">جامعي</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 px-3">المجموعة</label>
                    <input className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold outline-none" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} placeholder="مثلاً: مجموعة الأحد" />
                 </div>

                 {/* Financials */}
                 <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/50 to-white p-6 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
                    <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2"><DollarSign size={16} /> الإعدادات المالية</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400">المبلغ المتفق عليه</label>
                          <input type="number" className="w-full p-4 bg-white rounded-2xl font-black outline-none border border-transparent focus:border-indigo-100 transition-all shadow-sm" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400">نظام المحاسبة</label>
                          <div className="flex items-center gap-2 h-full">
                            <input type="checkbox" className="w-5 h-5 rounded text-indigo-600" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} />
                            <span className="text-xs font-bold text-slate-600">بالساعة</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Phones */}
                 <div className="md:col-span-2 space-y-3">
                    <div className="flex justify-between items-center px-2">
                       <label className="text-xs font-black text-slate-500"><Phone size={14} className="inline ml-1" /> الهواتف</label>
                       <button onClick={() => setForm({...form, phones: [...form.phones, {number: '', label: 'هاتف جديد'}]})} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors">+ إضافة</button>
                    </div>
                    {form.phones.map((phone, idx) => (
                       <div key={idx} className="flex gap-2 animate-in slide-in-from-right-2">
                          <input className="flex-[2] p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" placeholder="الرقم" value={phone.number} onChange={e => updatePhone(idx, 'number', e.target.value)} />
                          <input className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" placeholder="اللقب" value={phone.label} onChange={e => updatePhone(idx, 'label', e.target.value)} />
                          {form.phones.length > 1 && (
                             <button onClick={() => setForm({...form, phones: form.phones.filter((_, i) => i !== idx)})} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                          )}
                       </div>
                    ))}
                  </div>
              </div>

              <button onClick={handleSaveStudent} disabled={isProcessing} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                 {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={20} />} {selectedStudent ? 'حفظ التغييرات' : 'إضافة الطالب'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
