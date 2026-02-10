
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, Trash2, Edit3, X, Save, RefreshCw, 
  ChevronDown, DollarSign, Clock, Hash, GraduationCap, MapPin, 
  Phone, Copy, MoveRight, CheckSquare, Square, AlertTriangle
} from 'lucide-react';

const Students = ({ isAdmin, profile, year, semester }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'edit' | 'migrate' | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // تفعيل وضع التحديد الجماعي
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // إعدادات الترحيل
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Fix: Added missing toggleGrade function to handle expanding/collapsing grade groups
  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const handleMigration = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('migrate_students', {
        student_ids: selectedIds,
        target_year: migrationConfig.targetYear,
        target_semester: migrationConfig.targetSemester,
        copy_financials: migrationConfig.copyFinancials,
        copy_lessons: migrationConfig.copyLessons
      });
      if (error) throw error;
      alert(`تم ترحيل ${selectedIds.length} طالب بنجاح إلى ${migrationConfig.targetYear} - فصل ${migrationConfig.targetSemester}`);
      setActiveModal(null);
      fetchStudents();
    } catch (err: any) { alert(err.message); }
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

  return (
    <div className="space-y-12 animate-diamond">
      {/* Header Panel */}
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Users size={32} /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">إدارة الطلاب</h2>
            <p className="text-slate-400 font-bold text-sm">الفترة: <span className="text-indigo-600">{year} - فصل {semester}</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
             <input placeholder="بحث في هذه الفترة..." className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold focus:ring-4 ring-indigo-50 transition-all outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => openModal('edit')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
             <Plus size={20} /> إضافة طالب
          </button>
        </div>
      </div>

      {/* Migration & Batch Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-10 py-6 rounded-[3rem] shadow-2xl flex items-center gap-8 border border-white/10 animate-in slide-in-from-bottom-10">
           <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">{selectedIds.length}</span>
              <span className="font-black text-xs uppercase tracking-widest text-slate-400">طلاب محددين</span>
           </div>
           <div className="h-10 w-px bg-white/10"></div>
           <button onClick={() => setActiveModal('migrate')} className="flex items-center gap-3 text-emerald-400 font-black text-sm hover:text-white transition-all">
              <MoveRight size={20} /> ترحيل الفترة
           </button>
           <button onClick={() => setSelectedIds([])} className="text-slate-500 hover:text-rose-400 font-black text-xs">إلغاء التحديد</button>
        </div>
      )}

      {/* Grade Folders */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-24 text-center">
             <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="font-black text-slate-400 text-xs tracking-widest uppercase">Scanning Diamond Vault...</p>
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
                                <h3 className="text-2xl font-black text-slate-900 uppercase">طلاب الصف {grade}</h3>
                                <p className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full mt-2 inline-block">تعداد: {gradeStudents.length} طلاب</p>
                            </div>
                        </div>
                        <ChevronDown className={`text-slate-200 transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180 text-indigo-600' : ''}`} size={32} />
                    </button>
                    
                    {expandedGrades.includes(grade) && (
                        <div className="p-10 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                            {gradeStudents.map((s: any) => (
                                <div key={s.id} className={`p-8 rounded-[3rem] border transition-all group shadow-sm hover:shadow-2xl relative ${selectedIds.includes(s.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:bg-white'}`}>
                                    {/* Selection Checkbox */}
                                    <button onClick={() => toggleSelect(s.id)} className="absolute top-8 left-8 p-3 text-indigo-400 hover:text-indigo-600 transition-all">
                                       {selectedIds.includes(s.id) ? <CheckSquare size={24} fill="white" /> : <Square size={24} />}
                                    </button>

                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white">
                                           {s.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-10">
                                           <h4 className="text-xl font-black text-slate-900 leading-tight truncate">{s.name}</h4>
                                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.group_name || 'طلاب فردي'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-8">
                                       <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl text-xs font-black">
                                          <span className="text-slate-400">التحصيل</span>
                                          <span className="text-indigo-600">${s.total_paid}</span>
                                       </div>
                                       <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">المتبقي</span>
                                          <span className={`text-lg font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance}</span>
                                       </div>
                                    </div>

                                    <div className="flex gap-2">
                                       <button onClick={() => openModal('edit', s)} className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"><Edit3 size={14} /> تعديل</button>
                                       <button onClick={async () => {
                                          if (confirm("حذف الطالب وكافة بياناته نهائياً؟")) {
                                             await supabase.from('students').delete().eq('id', s.id);
                                             fetchStudents();
                                          }
                                       }} className="flex-1 py-4 bg-white text-rose-300 rounded-2xl font-black text-[10px] hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"><Trash2 size={14} /> حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* Migration Modal */}
      {activeModal === 'migrate' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-2xl">
           <div className="bg-white w-full max-w-xl p-14 rounded-[5rem] shadow-2xl space-y-10 animate-in zoom-in duration-500 text-right">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <div className="flex items-center gap-6">
                    <div className="bg-emerald-50 p-5 rounded-3xl text-emerald-600"><MoveRight size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900">ترحيل الطلاب الماسي</h3>
                       <p className="text-slate-400 font-bold text-sm">سيتم نقل {selectedIds.length} طالب إلى فترة جديدة.</p>
                    </div>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">السنة المستهدفة</label>
                       <select className="w-full p-5 bg-slate-50 rounded-[2rem] font-black border-none shadow-inner" value={migrationConfig.targetYear} onChange={e => setMigrationConfig({...migrationConfig, targetYear: e.target.value})}>
                          <option value="2024-2025">2024-2025</option>
                          <option value="2025-2026">2025-2026</option>
                          <option value="2026-2027">2026-2027</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الفصل المستهدف</label>
                       <select className="w-full p-5 bg-slate-50 rounded-[2rem] font-black border-none shadow-inner" value={migrationConfig.targetSemester} onChange={e => setMigrationConfig({...migrationConfig, targetSemester: e.target.value})}>
                          <option value="1">الفصل الأول</option>
                          <option value="2">الفصل الثاني</option>
                       </select>
                    </div>
                 </div>

                 <div className="p-8 bg-amber-50 rounded-[3rem] border border-amber-100 space-y-4">
                    <h4 className="flex items-center gap-3 font-black text-amber-700 text-sm"><AlertTriangle size={18} /> خيارات ترحيل البيانات</h4>
                    <div className="space-y-4">
                       <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600" checked={migrationConfig.copyFinancials} onChange={e => setMigrationConfig({...migrationConfig, copyFinancials: e.target.checked})} />
                          <span className="text-xs font-black text-slate-600 group-hover:text-indigo-600 transition-colors">ترحيل كافة المدفوعات المسجلة مسبقاً لهذا الطالب</span>
                       </label>
                       <label className="flex items-center gap-4 cursor-pointer group">
                          <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600" checked={migrationConfig.copyLessons} onChange={e => setMigrationConfig({...migrationConfig, copyLessons: e.target.checked})} />
                          <span className="text-xs font-black text-slate-600 group-hover:text-indigo-600 transition-colors">ترحيل كافة سجلات الحصص المسجلة مسبقاً</span>
                       </label>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black text-lg">إلغاء</button>
                 <button onClick={handleMigration} disabled={isProcessing} className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-4">
                   {isProcessing ? <RefreshCw className="animate-spin" /> : <CheckSquare size={24} />} تأكيد ترحيل البيانات
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Edit/Add Modal - Updated with year/semester info */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl">
           <div className="bg-white w-full max-w-3xl p-12 rounded-[4rem] shadow-2xl space-y-10 animate-in zoom-in text-right overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                 <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><GraduationCap size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900">{selectedStudent ? 'تحديث ملف الطالب' : 'إنشاء ملف طالب جديد'}</h3>
                       <p className="text-slate-400 font-bold text-sm">أنت تقوم بالإضافة للفترة: <span className="text-indigo-600">{year} - فصل {semester}</span></p>
                    </div>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">اسم الطالب بالكامل</label>
                   <input required className="w-full px-8 py-5 bg-slate-50 rounded-3xl font-bold border-none shadow-inner focus:ring-4 ring-indigo-50 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المرحلة الدراسية</label>
                   <select className="w-full px-6 py-5 bg-slate-50 rounded-3xl font-black border-none focus:ring-4 ring-indigo-50" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="12">الثاني عشر (توجيهي)</option><option value="11">الحادي عشر</option><option value="10">العاشر</option>
                    <option value="9">التاسع</option><option value="8">الثامن</option>
                  </select>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">اسم المجموعة / المجلد</label>
                   <input placeholder="مثلاً: مجموعة السبت" className="w-full px-8 py-5 bg-slate-50 rounded-3xl font-bold border-none shadow-inner" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} />
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest">رقم هاتف الطالب/ولي الأمر</label>
                   <input type="tel" className="w-full px-8 py-5 bg-slate-50 rounded-3xl font-bold border-none shadow-inner text-left" value={form.phones[0].number} onChange={e => {
                      const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                   }} />
                </div>
              </div>

              <div className="p-10 bg-indigo-50 rounded-[3.5rem] border border-indigo-100 space-y-8">
                 <h4 className="font-black text-indigo-600 flex items-center gap-4 text-xl"><DollarSign size={24} className="bg-white p-2 rounded-2xl shadow-sm" /> الاتفاق المالي الماسي</h4>
                 
                 <div className="flex bg-white/50 p-2 rounded-3xl gap-2">
                    <button type="button" onClick={() => setForm({...form, is_hourly: false})} className={`flex-1 py-4 rounded-[1.5rem] font-black text-sm transition-all ${!form.is_hourly ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>مبلغ مقطوع للفصل</button>
                    <button type="button" onClick={() => setForm({...form, is_hourly: true})} className={`flex-1 py-4 rounded-[1.5rem] font-black text-sm transition-all ${form.is_hourly ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>نظام الحصة / الساعة</button>
                 </div>
                 
                 <div className="animate-in slide-in-from-top-4">
                    {form.is_hourly ? (
                       <div className="space-y-3 text-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">سعر الساعة المتفق عليه</label>
                          <input type="number" step="0.5" className="w-full p-8 bg-white rounded-[2.5rem] font-black text-5xl text-center border-none shadow-xl focus:ring-8 ring-indigo-100 outline-none" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                       </div>
                    ) : (
                       <div className="space-y-3 text-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ الإجمالي للفصل الدراسي</label>
                          <input type="number" step="1" className="w-full p-8 bg-white rounded-[2.5rem] font-black text-5xl text-center border-none shadow-xl focus:ring-8 ring-indigo-100 outline-none" value={form.get_amount || form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                       </div>
                    )}
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-lg">إلغاء</button>
                 <button onClick={handleAction} disabled={isProcessing} className="flex-[2] py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
                   {isProcessing ? <RefreshCw className="animate-spin" /> : <Save size={24} />} حفظ ملف الطالب
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
