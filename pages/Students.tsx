
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, Trash2, CheckCircle, X, AlertCircle, Users, MessageCircle, 
  Phone, Search, Folder, FolderOpen, RefreshCw, ChevronRight, ChevronLeft, Save, Settings,
  Copy, ArrowRightLeft, Database, HardDriveDownload, History, ShieldCheck, Lock, GraduationCap, FileText,
  DollarSign
} from 'lucide-react';

const Students = ({ isAdmin, role, uid, year, semester }: { isAdmin: boolean, role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // حالات نافذة العمليات المتقدمة (النسخ والترحيل)
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const [studentToManage, setStudentToManage] = useState<any>(null);
  const [opsConfig, setOpsConfig] = useState({
    targetYear: year,
    targetSemester: semester,
    targetGrade: '',
    includeLessons: false,
    includePayments: false,
    includeAcademic: false,
    operationType: 'copy' as 'copy' | 'move'
  });

  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: '', address: '', school_name: '', grade: '12', 
    agreed_amount: '', is_hourly: false, price_per_hour: '',
    phones: [{ number: '', label: 'الطالب' }] as any[]
  });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (role !== 'admin') query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('is_completed', { ascending: true }).order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e: any) { 
      showFeedback(`فشل تحميل السجل: ${e.message}`, "error");
    } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // منطق العمليات المتقدمة (النقل والنسخ)
  const handleAdvancedOp = async () => {
    if (!studentToManage || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // تدقيق الصلاحيات: المعلم لا يمكنه التصرف بطلاب غيره
      if (role !== 'admin' && studentToManage.teacher_id !== uid) {
        throw new Error("عذراً، لا تملك صلاحية الوصول لهذا الطالب.");
      }

      // 1. إنشاء الطالب في الوجهة الجديدة
      const newStudentData = {
        name: studentToManage.name,
        address: studentToManage.address,
        school_name: studentToManage.school_name,
        grade: opsConfig.targetGrade || studentToManage.grade,
        phones: studentToManage.phones,
        agreed_amount: studentToManage.agreed_amount,
        is_hourly: studentToManage.is_hourly,
        price_per_hour: studentToManage.price_per_hour,
        teacher_id: studentToManage.teacher_id,
        academic_year: opsConfig.targetYear,
        semester: opsConfig.targetSemester,
      };

      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert([newStudentData])
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. ترحيل السجلات الإضافية بناءً على الاختيار
      const transferPromises: any[] = [];

      if (opsConfig.includeLessons) {
        const { data: lessons } = await supabase.from('lessons').select('*').eq('student_id', studentToManage.id);
        if (lessons && lessons.length > 0) {
          const newLessons = lessons.map(l => ({ ...l, id: undefined, student_id: newStudent.id, created_at: undefined }));
          transferPromises.push(supabase.from('lessons').insert(newLessons));
        }
      }

      if (opsConfig.includePayments) {
        const { data: payments } = await supabase.from('payments').select('*').eq('student_id', studentToManage.id);
        if (payments && payments.length > 0) {
          const newPayments = payments.map(p => ({ ...p, id: undefined, student_id: newStudent.id, created_at: undefined }));
          transferPromises.push(supabase.from('payments').insert(newPayments));
        }
      }

      if (opsConfig.includeAcademic) {
        const { data: academic } = await supabase.from('academic_records').select('*').eq('student_id', studentToManage.id);
        if (academic && academic.length > 0) {
          const newAcademic = academic.map(a => ({ ...a, id: undefined, student_id: newStudent.id, created_at: undefined }));
          transferPromises.push(supabase.from('academic_records').insert(newAcademic));
        }
      }

      if (transferPromises.length > 0) await Promise.all(transferPromises);

      // 3. إذا كانت العملية "نقل" نقوم بحذف الأصلي
      if (opsConfig.operationType === 'move') {
        await supabase.from('students').delete().eq('id', studentToManage.id);
      }

      showFeedback(opsConfig.operationType === 'copy' ? "تم نسخ الطالب بنجاح" : "تم ترحيل الطالب بنجاح");
      setIsOpsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const validPhones = Array.isArray(form.phones) ? form.phones.filter(p => p && p.number) : [];
      const studentData = { 
        name: form.name.trim(), address: form.address, school_name: form.school_name, grade: form.grade,
        phones: validPhones, agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
        teacher_id: uid, academic_year: year, semester: semester
      };

      if (isEditMode && selectedStudentId) {
        await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      } else {
        await supabase.from('students').insert([studentData]);
      }
      showFeedback(isEditMode ? 'تم تحديث البيانات' : 'تمت الإضافة');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { 
      showFeedback(`فشلت العملية: ${err.message}`, 'error'); 
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('سيتم حذف الطالب وكافة سجلاته المالية والتدريسية نهائياً. هل أنت متأكد؟')) return;
    try {
      await supabase.from('students').delete().eq('id', id);
      showFeedback("تم حذف الطالب بنجاح");
      fetchStudents();
    } catch (e: any) { showFeedback("فشل الحذف", "error"); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === 'الكل' || s.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, selectedGrade]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-right pb-24 font-['Cairo']">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black transition-all animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-10 lg:p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8">
           <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl shrink-0"><Users size={32}/></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900">قاعدة الطلاب</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">السنة الحالية: {year} | الفصل: {semester}</p>
           </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input placeholder="ابحث..." className="w-full pr-14 pl-6 py-4 bg-slate-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-50 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3"><Plus size={20}/> إضافة</button>
        </div>
      </div>

      {/* Grade Selector Tags */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {['الكل', '10', '11', '12'].map(grade => (
          <button key={grade} onClick={() => setSelectedGrade(grade)} className={`px-10 py-4 rounded-2xl font-black text-xs transition-all whitespace-nowrap ${selectedGrade === grade ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>
            {grade === 'الكل' ? 'كافة المراحل' : `الصف ${grade}`}
          </button>
        ))}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" size={40} /></div>
        ) : filteredStudents.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
               <div className="cursor-pointer" onClick={() => navigate('/lessons', { state: { studentToOpen: s } })}>
                 <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 truncate">{s.name}</h3>
                 <p className="text-[10px] font-black text-slate-400 mt-1 uppercase">الصف {s.grade} - {s.is_hourly ? 'خارجي' : 'فصلي'}</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => { 
                   setStudentToManage(s); 
                   setOpsConfig({...opsConfig, targetGrade: s.grade, targetYear: year, targetSemester: semester});
                   setIsOpsModalOpen(true); 
                 }} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="التحكم الكامل والترحيل">
                   <Settings size={18}/>
                 </button>
                 <button onClick={() => handleDeleteStudent(s.id)} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                   <Trash2 size={18}/>
                 </button>
               </div>
            </div>

            <div className="space-y-3 mb-8">
               {s.phones?.slice(0, 1).map((p: any, i: number) => (
                 <div key={i} className="flex items-center gap-3 text-[11px] font-black text-slate-500 bg-slate-50 p-3 rounded-2xl">
                    <Phone size={14} className="text-indigo-400" />
                    <span>{p.label}: {p.number}</span>
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase">الرصيد المتبقي</p>
                  <p className={`text-xl font-black ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ${(s.remaining_balance || 0).toLocaleString()}
                  </p>
               </div>
               <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className="bg-slate-900 text-white p-4 rounded-2xl group-hover:bg-indigo-600 transition-all shadow-lg">
                 <ChevronLeft size={20} className="rotate-180" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Operations Modal (Smart Control Center) */}
      {isOpsModalOpen && studentToManage && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl p-10 lg:p-14 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300 text-right overflow-y-auto max-h-[90vh] no-scrollbar">
              <button onClick={() => setIsOpsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={32}/></button>
              
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100"><ArrowRightLeft size={30}/></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900">مركز ترحيل البيانات</h2>
                       <p className="text-xs font-bold text-slate-400 mt-1 uppercase">الطالب: {studentToManage.name}</p>
                    </div>
                 </div>
                 <div className="hidden md:flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <ShieldCheck size={16}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">تحكم آمن</span>
                 </div>
              </div>

              <div className="space-y-8">
                 {/* 1. Operation Type */}
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setOpsConfig({...opsConfig, operationType: 'copy'})} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${opsConfig.operationType === 'copy' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-slate-50 bg-slate-50/30 text-slate-400'}`}>
                       <Copy size={24}/>
                       <span className="font-black text-sm">نسخ (تكرار السجل)</span>
                    </button>
                    <button onClick={() => setOpsConfig({...opsConfig, operationType: 'move'})} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${opsConfig.operationType === 'move' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-slate-50 bg-slate-50/30 text-slate-400'}`}>
                       <ArrowRightLeft size={24}/>
                       <span className="font-black text-sm">نقل (ترحيل نهائي)</span>
                    </button>
                 </div>

                 {/* 2. Destination (Year, Semester, Grade) */}
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Database size={14}/> وجهة البيانات المستهدفة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <select className="p-4 bg-white border-none rounded-2xl font-black text-xs outline-none shadow-sm" value={opsConfig.targetYear} onChange={e => setOpsConfig({...opsConfig, targetYear: e.target.value})}>
                          <option value="2025-2026">2025-2026</option>
                          <option value="2026-2027">2026-2027</option>
                          <option value="2027-2028">2027-2028</option>
                       </select>
                       <select className="p-4 bg-white border-none rounded-2xl font-black text-xs outline-none shadow-sm" value={opsConfig.targetSemester} onChange={e => setOpsConfig({...opsConfig, targetSemester: e.target.value})}>
                          <option value="1">الفصل 1</option>
                          <option value="2">الفصل 2</option>
                       </select>
                       <select className="p-4 bg-white border-none rounded-2xl font-black text-xs outline-none shadow-sm" value={opsConfig.targetGrade} onChange={e => setOpsConfig({...opsConfig, targetGrade: e.target.value})}>
                          <option value="10">الصف 10</option>
                          <option value="11">الصف 11</option>
                          <option value="12">الصف 12</option>
                       </select>
                    </div>
                 </div>

                 {/* 3. Data Inclusions */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">تحديد البيانات المرفقة</h4>
                       <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1"><Lock size={10}/> حماية مشفرة</span>
                    </div>
                    <div className="space-y-3">
                       <label className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2rem] cursor-pointer hover:bg-indigo-50/30 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><History size={18}/></div>
                             <span className="font-bold text-slate-700 text-sm">ترحيل سجل الحصص</span>
                          </div>
                          <input type="checkbox" className="w-6 h-6 accent-indigo-600 rounded-lg" checked={opsConfig.includeLessons} onChange={e => setOpsConfig({...opsConfig, includeLessons: e.target.checked})} />
                       </label>
                       <label className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2rem] cursor-pointer hover:bg-emerald-50/30 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all"><DollarSign size={18}/></div>
                             <span className="font-bold text-slate-700 text-sm">ترحيل سجل المالية والمدفوعات</span>
                          </div>
                          <input type="checkbox" className="w-6 h-6 accent-indigo-600 rounded-lg" checked={opsConfig.includePayments} onChange={e => setOpsConfig({...opsConfig, includePayments: e.target.checked})} />
                       </label>
                       <label className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2rem] cursor-pointer hover:bg-amber-50/30 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all"><FileText size={18}/></div>
                             <span className="font-bold text-slate-700 text-sm">ترحيل السجل الأكاديمي والتقدم</span>
                          </div>
                          <input type="checkbox" className="w-6 h-6 accent-indigo-600 rounded-lg" checked={opsConfig.includeAcademic} onChange={e => setOpsConfig({...opsConfig, includeAcademic: e.target.checked})} />
                       </label>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mr-4 italic">* في حال عدم الاختيار، سيتم نقل ملف الطالب الأساسي فقط (صفحة مالية بيضاء).</p>
                 </div>

                 <button disabled={isSubmitting} onClick={handleAdvancedOp} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 text-lg disabled:opacity-50">
                    {isSubmitting ? <RefreshCw className="animate-spin" /> : <HardDriveDownload size={24}/>}
                    تأكيد عملية {opsConfig.operationType === 'copy' ? 'النسخ' : 'الترحيل النهائى'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Add/Edit Modal (Basic Data) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-3xl z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-2xl p-10 lg:p-14 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={32}/></button>
            <h2 className="text-3xl font-black mb-10 text-slate-900 flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white"><Plus size={24}/></div>
              {isEditMode ? 'تعديل البيانات' : 'إضافة طالب جديد'}
            </h2>
            
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">اسم الطالب</label>
                    <input required placeholder="الاسم الكامل..." className="w-full p-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">المرحلة الدراسية</label>
                    <select className="w-full p-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       <option value="10">الصف العاشر</option>
                       <option value="11">الحادي عشر</option>
                       <option value="12">الثاني عشر</option>
                    </select>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">بيانات التواصل</label>
                  {form.phones.map((phone, index) => (
                    <div key={index} className="flex gap-3">
                       <input placeholder="رقم الهاتف..." className="flex-1 p-5 bg-slate-50 rounded-[2rem] font-black outline-none text-left tracking-widest" value={phone.number} onChange={e => {
                         const n = [...form.phones]; n[index].number = e.target.value; setForm({...form, phones: n});
                       }} />
                       <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-[10px]" value={phone.label} onChange={e => {
                         const n = [...form.phones]; n[index].label = e.target.value; setForm({...form, phones: n});
                       }}>
                          <option>الطالب</option><option>الأب</option><option>الأم</option>
                       </select>
                    </div>
                  ))}
               </div>

               <div className="p-8 bg-indigo-50/50 rounded-[3rem] space-y-6 border border-indigo-100/50">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="hourly" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-6 h-6 accent-indigo-600 cursor-pointer" />
                    <label htmlFor="hourly" className="font-black text-slate-700 text-sm cursor-pointer">محاسبة خارجية (بالساعة)</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة..." className="w-full p-5 bg-white rounded-[2rem] font-black text-center text-2xl text-indigo-600 shadow-inner" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="الاتفاق المالي الإجمالي..." className="w-full p-5 bg-white rounded-[2rem] font-black text-center text-2xl text-slate-900 shadow-inner" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
            </div>

            <button disabled={isSubmitting} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] mt-10 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 text-lg">
              {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={24}/>}
              حفظ بيانات الطالب
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
