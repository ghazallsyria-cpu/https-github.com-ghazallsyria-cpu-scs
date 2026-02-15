
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, Copy, MoveRight, CheckSquare, Square, CheckCircle2,
  Phone, MapPin, DollarSign, Calendar, GraduationCap, School, UserPlus
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

  // النموذج الكامل للطلاب
  const initialFormState = {
    name: '', 
    grade: '12', 
    group_name: '', 
    address: '', 
    academic_year: year, 
    semester: semester,
    agreed_amount: '0', 
    is_hourly: false, 
    price_per_hour: '0', 
    phones: [{number: '', label: 'طالب'}, {number: '', label: 'ولي أمر'}]
  };
  const [form, setForm] = useState(initialFormState);

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

  const handleSaveStudent = async () => {
    setIsProcessing(true);
    try {
      // تنظيف البيانات قبل الإرسال
      const payload = {
        ...form,
        agreed_amount: parseFloat(form.agreed_amount) || 0,
        price_per_hour: parseFloat(form.price_per_hour) || 0,
        teacher_id: profile.id, // ضمان ربط الطالب بالمعلم الحالي
        phones: form.phones.filter(p => p.number.trim() !== '') // إزالة الهواتف الفارغة
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
      setForm(initialFormState); // تصفير النموذج
    } catch (err: any) {
      alert("خطأ في الحفظ: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (student: any) => {
    setSelectedStudent(student);
    if (student) {
      setForm({
        ...student,
        phones: student.phones && student.phones.length > 0 ? student.phones : [{number: '', label: 'طالب'}],
        agreed_amount: String(student.agreed_amount),
        price_per_hour: String(student.price_per_hour)
      });
    } else {
      setForm(initialFormState);
    }
    setActiveModal('edit');
  };

  const updatePhone = (index: number, field: string, value: string) => {
    const newPhones = [...form.phones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setForm({ ...form, phones: newPhones });
  };

  const addPhoneField = () => {
    setForm({ ...form, phones: [...form.phones, { number: '', label: 'هاتف جديد' }] });
  };

  const removePhoneField = (index: number) => {
    const newPhones = form.phones.filter((_, i) => i !== index);
    setForm({ ...form, phones: newPhones });
  };

  const groupedStudents = useMemo(() => {
    return students.reduce((acc, s) => {
      const g = s.grade || 'غير محدد';
      if (!acc[g]) acc[g] = [];
      acc[g].push(s);
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
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tighter">إدارة الطلاب</h2>
                <span className="text-[10px] font-bold text-slate-400 block">{year} - فصل {semester}</span>
              </div>
           </div>
           <button onClick={() => openEditModal(null)} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-2">
              <Plus size={20} /> <span className="hidden md:inline font-black text-xs">طالب جديد</span>
           </button>
        </div>

        <div className="relative">
           <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input placeholder="البحث..." className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

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
        {loading ? (
            <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-black text-slate-300">جاري تحميل السجلات...</p>
            </div>
        ) : Object.keys(groupedStudents).sort((a,b) => isNaN(Number(a)) ? 1 : Number(b)-Number(a)).map(grade => {
            const gradeStds = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStds.length === 0) return null;
            return (
              <div key={grade} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <button onClick={() => setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade])} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl"><Folder size={20} fill="currentColor" /></div>
                      <div className="text-right">
                          <h3 className="font-black text-slate-900">الصف {grade}</h3>
                          <p className="text-[9px] font-bold text-slate-400">إجمالي: {gradeStds.length}</p>
                      </div>
                   </div>
                   <ChevronDown className={`text-slate-200 transition-transform ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={20} />
                </button>
                {expandedGrades.includes(grade) && (
                  <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                    {gradeStds.map((s: any) => (
                      <div key={s.id} className={`p-6 rounded-[2rem] border transition-all relative group ${selectedIds.includes(s.id) ? 'border-indigo-600 bg-indigo-50/20' : 'bg-slate-50 border-transparent hover:bg-white hover:shadow-md'}`}>
                        <button onClick={() => toggleSelection(s.id)} className="absolute top-4 left-4 p-2 z-10">{selectedIds.includes(s.id) ? <CheckCircle2 className="text-indigo-600" size={20} /> : <Square className="text-slate-200" size={20} />}</button>
                        
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 text-lg shadow-sm border border-slate-100">{s.name[0]}</div>
                           <div className="flex-1 min-w-0 pr-1">
                               <h4 className="font-black text-slate-900 truncate">{s.name}</h4>
                               <p className="text-[9px] font-bold text-slate-400">{s.group_name || 'فردي'}</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/50 p-3 rounded-xl mb-4">
                            <span className="text-[10px] font-black text-slate-400">المبلغ:</span>
                            <span className="font-black text-emerald-600 text-sm">${s.agreed_amount}</span>
                        </div>

                        <div className="flex gap-2">
                           <button onClick={() => openEditModal(s)} className="flex-1 py-2.5 bg-white text-indigo-600 rounded-xl font-black text-[10px] shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"><Edit3 size={14} /> تعديل</button>
                           <button onClick={() => { setSelectedStudent(s); setActiveModal('copy'); }} className="flex-1 py-2.5 bg-white text-emerald-600 rounded-xl font-black text-[10px] shadow-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"><Copy size={14} /> نسخ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Move/Copy Modal */}
      {(activeModal === 'move' || activeModal === 'copy') && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
           <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl text-center space-y-6 animate-in zoom-in">
              <h3 className="text-2xl font-black">{activeModal === 'move' ? 'نقل الطلاب' : 'نسخ السجل'}</h3>
              <div className="space-y-4 text-right">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400">السنة الأكاديمية</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none" value={targetConfig.year} onChange={e => setTargetConfig({...targetConfig, year: e.target.value})}>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400">الفصل الدراسي</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none" value={targetConfig.semester} onChange={e => setTargetConfig({...targetConfig, semester: e.target.value})}>
                        <option value="1">فصل 1</option>
                        <option value="2">فصل 2</option>
                    </select>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-100 font-black rounded-2xl">إلغاء</button>
                 <button onClick={activeModal === 'move' ? handleBulkMove : () => handleDuplicate(selectedStudent)} disabled={isProcessing} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">{isProcessing ? 'جاري...' : 'تأكيد'}</button>
              </div>
           </div>
        </div>
      )}

      {/* Full Edit/Add Modal */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl overflow-y-auto">
           <div className="bg-white w-full max-w-2xl p-8 md:p-10 rounded-[3rem] shadow-2xl space-y-8 my-auto animate-in zoom-in duration-300">
              <div className="flex justify-between items-center border-b pb-6">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg"><UserPlus size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedStudent ? 'تعديل بيانات طالب' : 'إضافة طالب جديد'}</h3>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* البيانات الأساسية */}
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-500 px-2 flex items-center gap-2"><Users size={14} /> اسم الطالب</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-100 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="الاسم الرباعي" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 px-2 flex items-center gap-2"><GraduationCap size={14} /> الصف الدراسي</label>
                    <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none cursor-pointer" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       {[...Array(12)].map((_, i) => <option key={i} value={`${i+1}`}>{i+1}</option>)}
                       <option value="13">جامعي</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 px-2 flex items-center gap-2"><School size={14} /> اسم المجموعة</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} placeholder="مثلاً: مجموعة الأحد" />
                 </div>

                 <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-500 px-2 flex items-center gap-2"><MapPin size={14} /> العنوان</label>
                    <input className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="المنطقة - القطعة - الشارع" />
                 </div>

                 {/* القسم المالي */}
                 <div className="md:col-span-2 bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                    <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2"><DollarSign size={16} /> البيانات المالية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400">المبلغ المتفق عليه (للكورس)</label>
                          <input type="number" className="w-full p-4 bg-white rounded-xl font-black outline-none border border-indigo-100" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                       </div>
                       <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-indigo-100">
                          <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} />
                          <label className="text-xs font-black text-slate-600">نظام بالساعة؟</label>
                       </div>
                    </div>
                 </div>

                 {/* أرقام الهواتف */}
                 <div className="md:col-span-2 space-y-3">
                    <div className="flex justify-between items-center">
                       <label className="text-xs font-black text-slate-500 px-2 flex items-center gap-2"><Phone size={14} /> أرقام التواصل</label>
                       <button onClick={addPhoneField} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100">+ إضافة رقم</button>
                    </div>
                    {form.phones.map((phone, idx) => (
                       <div key={idx} className="flex gap-2">
                          <input className="flex-[2] p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none" placeholder="الرقم" value={phone.number} onChange={e => updatePhone(idx, 'number', e.target.value)} />
                          <input className="flex-1 p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none" placeholder="الصفة (أب/أم)" value={phone.label} onChange={e => updatePhone(idx, 'label', e.target.value)} />
                          {form.phones.length > 1 && (
                             <button onClick={() => removePhoneField(idx)} className="p-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                          )}
                       </div>
                    ))}
                  </div>
              </div>

              <button onClick={handleSaveStudent} disabled={isProcessing} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                 {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={20} />} {selectedStudent ? 'حفظ التعديلات' : 'إضافة الطالب'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
