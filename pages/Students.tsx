
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, 
  Trash2, Edit3, X, Save, RefreshCw, ChevronDown, DollarSign, Clock, Hash, GraduationCap, MapPin, Phone
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    } catch (err: any) { alert(err.message); }
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
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Panel */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Users size={32} /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة <span className="text-indigo-600">الطلاب</span></h2>
            <p className="text-slate-400 font-bold text-sm">تنظيم الطلاب في مجموعات دراسية ومالية.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
             <input placeholder="بحث باسم الطالب..." className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold focus:ring-4 ring-indigo-50 transition-all outline-none shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => openModal('edit')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
             <Plus size={20} /> إضافة طالب
          </button>
        </div>
      </div>

      {/* Grade Folders */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-24 text-center">
             <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="font-black text-slate-400 text-xs">جاري فحص المجلدات الدراسية...</p>
          </div>
        ) : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => {
            const gradeStudents = groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm));
            if (gradeStudents.length === 0) return null;
            return (
                <div key={grade} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => toggleGrade(grade)} className="w-full p-10 flex items-center justify-between hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                               <Folder size={28} fill="currentColor" />
                            </div>
                            <div className="text-right">
                                <h3 className="text-2xl font-black text-slate-900">طلاب الصف {grade}</h3>
                                <p className="text-xs font-bold text-slate-400 bg-slate-100 px-4 py-1 rounded-full mt-2 inline-block">عدد المقيدين: {gradeStudents.length}</p>
                            </div>
                        </div>
                        <ChevronDown className={`text-slate-200 transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={32} />
                    </button>
                    
                    {expandedGrades.includes(grade) && (
                        <div className="p-10 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                            {gradeStudents.map((s: any) => (
                                <div key={s.id} className="p-8 bg-slate-50 rounded-[3rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group shadow-sm hover:shadow-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">{s.name[0]}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openModal('edit', s)} className="p-3 bg-white text-slate-400 rounded-xl hover:text-indigo-600 shadow-sm"><Edit3 size={16} /></button>
                                            <button onClick={async () => {
                                               if (confirm("هل تريد حذف هذا الطالب وكافة سجلاته؟")) {
                                                  await supabase.from('students').delete().eq('id', s.id);
                                                  fetchStudents();
                                               }
                                            }} className="p-3 bg-white text-rose-300 rounded-xl hover:bg-rose-500 hover:text-white shadow-sm"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">{s.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-6"><MapPin size={14} /> {s.address || 'لم يحدد العنوان'}</p>
                                    
                                    <div className="space-y-3">
                                       <div className="flex justify-between items-center bg-white/50 p-3 rounded-2xl">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">المجموعة</span>
                                          <span className="text-xs font-black text-indigo-600">{s.group_name || 'طلاب فردي'}</span>
                                       </div>
                                       <div className="flex justify-between items-center bg-white/50 p-3 rounded-2xl">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">النظام</span>
                                          <span className={`text-xs font-black ${s.is_hourly ? 'text-amber-600' : 'text-blue-600'}`}>{s.is_hourly ? 'ساعة' : 'مقطوع'}</span>
                                       </div>
                                       <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">المتبقي</span>
                                          <span className={`text-lg font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance}</span>
                                       </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* Edit/Add Modal */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
           <div className="bg-white w-full max-w-3xl p-12 rounded-[4rem] shadow-2xl space-y-10 animate-in zoom-in text-right overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><GraduationCap size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900">{selectedStudent ? 'تحديث ملف الطالب' : 'إنشاء ملف طالب'}</h3>
                       <p className="text-slate-400 font-bold text-sm">أدخل البيانات الدراسية والمالية بدقة.</p>
                    </div>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-50 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">اسم الطالب بالكامل</label>
                   <div className="relative">
                      <Users className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input required className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-3xl font-bold border-none focus:ring-4 ring-indigo-50 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                   </div>
                </div>
                
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المرحلة الدراسية</label>
                   <select className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-black border-none focus:ring-4 ring-indigo-50 outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="12">الثاني عشر (توجيهي)</option><option value="11">الحادي عشر</option><option value="10">العاشر</option>
                    <option value="9">التاسع</option><option value="8">الثامن</option>
                  </select>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">اسم المجموعة / المجلد</label>
                   <div className="relative">
                      <Folder className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-3xl font-bold border-none" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">رقم هاتف التواصل</label>
                   <div className="relative">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input type="tel" className="w-full pr-14 pl-6 py-5 bg-slate-50 rounded-3xl font-bold border-none text-left" value={form.phones[0].number} onChange={e => {
                        const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                      }} />
                   </div>
                </div>
              </div>

              <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 space-y-8">
                 <h4 className="font-black text-indigo-600 flex items-center gap-4 text-xl"><DollarSign size={24} className="bg-white p-1 rounded-lg" /> الإعداد المالي الماسي</h4>
                 
                 <div className="flex bg-white/50 p-2 rounded-3xl gap-2">
                    <button type="button" onClick={() => setForm({...form, is_hourly: false})} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${!form.is_hourly ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white'}`}><Hash size={18} /> مبلغ مقطوع</button>
                    <button type="button" onClick={() => setForm({...form, is_hourly: true})} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${form.is_hourly ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white'}`}><Clock size={18} /> نظام الساعة</button>
                 </div>
                 
                 <div className="animate-in slide-in-from-top-4 duration-500">
                    {form.is_hourly ? (
                       <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">سعر الساعة المتفق عليه ($)</label>
                          <input type="number" step="0.5" className="w-full p-6 bg-white rounded-3xl font-black border-none shadow-sm focus:ring-4 ring-indigo-100 outline-none text-2xl" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                       </div>
                    ) : (
                       <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المبلغ الإجمالي للفصل ($)</label>
                          <input type="number" step="1" className="w-full p-6 bg-white rounded-3xl font-black border-none shadow-sm focus:ring-4 ring-indigo-100 outline-none text-2xl" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-lg">إلغاء التغييرات</button>
                 <button onClick={handleAction} disabled={isProcessing} className="flex-[2] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
                   {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={24} />} حفظ بيانات الطالب والمالية
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
