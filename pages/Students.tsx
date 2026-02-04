
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { 
  Plus, Trash2, CheckCircle, X, AlertCircle, Users, School, MessageCircle, 
  Phone, MapPin, Search, Folder, FolderOpen, Layers, RefreshCw, MoreVertical, 
  Edit3, Copy, MoveRight, Settings2, Save
} from 'lucide-react';

const Students = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveData, setMoveData] = useState({ year: year, semester: semester, action: 'move' as 'move' | 'copy' });
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [form, setForm] = useState({ 
    name: '', address: '', school_name: '', grade: '12', 
    agreed_amount: '', is_hourly: false, price_per_hour: '',
    phones: [{ number: '', label: 'الطالب' }] as any[]
  });

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e) { 
      console.error(e);
      showFeedback("خطأ في جلب البيانات", "error"); 
    } finally { 
      setLoading(false); 
    }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedStudentId(null);
    setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: any) => {
    setIsEditMode(true);
    setSelectedStudentId(student.id);
    setForm({ 
      name: student.name, 
      address: student.address || '', 
      school_name: student.school_name || '', 
      grade: student.grade,
      agreed_amount: student.agreed_amount?.toString() || '', 
      is_hourly: student.is_hourly, 
      price_per_hour: student.price_per_hour?.toString() || '',
      phones: student.phones || [{ number: '', label: 'الطالب' }]
    });
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return showFeedback("خطأ في جلسة الدخول", "error");
    
    setIsSubmitting(true);
    try {
      const validPhones = form.phones.filter(p => p.number.trim() !== '');
      if (validPhones.length === 0) throw new Error("يجب إضافة رقم هاتف واحد على الأقل");

      const studentData = { 
        name: form.name, 
        address: form.address, 
        school_name: form.school_name, 
        grade: form.grade,
        phones: validPhones,
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly, 
        price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
        teacher_id: uid, 
        academic_year: year, 
        semester: semester
      };

      let error;
      if (isEditMode && selectedStudentId) {
        const { error: err } = await supabase.from('students').update(studentData).eq('id', selectedStudentId);
        error = err;
      } else {
        const { error: err } = await supabase.from('students').insert([studentData]);
        error = err;
      }
      
      if (error) throw error;
      
      showFeedback(isEditMode ? 'تم تحديث البيانات بنجاح' : 'تمت إضافة الطالب بنجاح');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { 
      showFeedback(err.message, 'error'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من حذف الطالب؟ سيتم حذف كافة الحصص والمدفوعات المرتبطة به بشكل نهائي.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      showFeedback('تم حذف الطالب وجميع بياناته بنجاح');
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveCopy = async () => {
    if (!selectedStudentId) return;
    setIsSubmitting(true);
    try {
      const student = students.find(s => s.id === selectedStudentId);
      if (!student) throw new Error("لم يتم العثور على بيانات الطالب");

      const newData = {
        ...student,
        id: undefined, // Let DB generate new ID if copying
        academic_year: moveData.year,
        semester: moveData.semester,
        created_at: undefined
      };
      // Remove summary view fields
      delete (newData as any).total_lessons;
      delete (newData as any).total_hours;
      delete (newData as any).total_paid;
      delete (newData as any).expected_income;
      delete (newData as any).remaining_balance;

      if (moveData.action === 'move') {
        const { error } = await supabase.from('students').update({
          academic_year: moveData.year,
          semester: moveData.semester
        }).eq('id', selectedStudentId);
        if (error) throw error;
        showFeedback('تم نقل الطالب إلى الفترة المحددة بنجاح');
      } else {
        const { error } = await supabase.from('students').insert([newData]);
        if (error) throw error;
        showFeedback('تم نسخ الطالب إلى الفترة المحددة بنجاح');
      }

      setIsMoveModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePhone = (index: number, field: string, value: string) => {
    const newPhones = [...form.phones];
    newPhones[index][field] = value;
    setForm({ ...form, phones: newPhones });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === 'الكل' || s.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, selectedGrade]);

  const gradeCounts = useMemo(() => {
    const counts: any = { '10': 0, '11': 0, '12': 0, 'الكل': students.length };
    students.forEach(s => {
      if (counts[s.grade] !== undefined) counts[s.grade]++;
    });
    return counts;
  }, [students]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><Layers size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">مركز الطلاب</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">إدارة الطلاب والتحكم الشامل</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="ابحث عن اسم الطالب..." 
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 whitespace-nowrap active:scale-95 transition-all"><Plus size={18}/> إضافة طالب</button>
        </div>
      </div>

      {/* Grade Folders View */}
      <div className="flex flex-wrap gap-4">
        {[
          { id: 'الكل', label: 'كافة الطلاب' },
          { id: '10', label: 'الصف العاشر (10)' },
          { id: '11', label: 'الحادي عشر (11)' },
          { id: '12', label: 'الثاني عشر (12)' },
        ].map((folder) => {
          const isActive = selectedGrade === folder.id;
          const count = gradeCounts[folder.id];
          return (
            <button
              key={folder.id}
              onClick={() => setSelectedGrade(folder.id)}
              className={`flex-1 min-w-[140px] p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${
                isActive 
                  ? 'border-indigo-600 bg-white shadow-xl -translate-y-1' 
                  : 'border-slate-100 bg-slate-50 hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                {isActive ? <FolderOpen size={20} /> : <Folder size={20} />}
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-black ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{folder.label}</p>
                <p className={`text-[9px] font-bold ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>{count} طالب</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Student Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" size={40} /></div>
        ) : filteredStudents.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-500 transition-all shadow-sm group animate-in zoom-in duration-300 relative">
            
            {/* Context Menu Button */}
            <div className="absolute top-6 left-6 z-10">
              <button 
                onClick={() => setActiveMenu(activeMenu === s.id ? null : s.id)}
                className={`p-2 rounded-xl transition-all ${activeMenu === s.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                <Settings2 size={18} />
              </button>
              
              {activeMenu === s.id && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-[20] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <button onClick={() => handleOpenEdit(s)} className="w-full px-5 py-3 text-right hover:bg-indigo-50 text-slate-700 font-bold text-xs flex items-center justify-between gap-3 group/item transition-colors">
                    <span className="group-hover/item:text-indigo-600">تعديل البيانات</span>
                    <Edit3 size={14} className="text-slate-300 group-hover/item:text-indigo-500" />
                  </button>
                  <button onClick={() => { setSelectedStudentId(s.id); setIsMoveModalOpen(true); setActiveMenu(null); }} className="w-full px-5 py-3 text-right hover:bg-emerald-50 text-slate-700 font-bold text-xs flex items-center justify-between gap-3 group/item transition-colors">
                    <span className="group-hover/item:text-emerald-600">نقل / نسخ الطالب</span>
                    <Copy size={14} className="text-slate-300 group-hover/item:text-emerald-500" />
                  </button>
                  <div className="h-px bg-slate-50 my-1 mx-4"></div>
                  <button onClick={() => handleDeleteStudent(s.id)} className="w-full px-5 py-3 text-right hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-between gap-3 group/item transition-colors">
                    <span>حذف الطالب نهائياً</span>
                    <Trash2 size={14} className="text-rose-300" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-start mb-6 pt-2">
               <div>
                 <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors pr-2">{s.name}</h3>
                 <div className="flex items-center gap-2 mt-2">
                   <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">الصف {s.grade}</span>
                   {s.school_name && <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1"><School size={12}/> {s.school_name}</span>}
                 </div>
               </div>
            </div>
            
            <div className="space-y-2.5 mb-8">
              {s.phones?.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">{p.label}:</span>
                    <span>{p.number}</span>
                  </div>
                  <a href={`https://wa.me/${p.number.replace(/\s/g, '')}`} target="_blank" className="bg-emerald-100 text-emerald-600 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><MessageCircle size={14}/></a>
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">المتبقي في الذمة</p>
                <p className={`text-xl font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${s.remaining_balance.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-2xl text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase">نظام المحاسبة</p>
                 <p className="text-[10px] font-black text-slate-700">{s.is_hourly ? 'بالساعة' : 'اتفاق فصلي'}</p>
              </div>
            </div>
          </div>
        ))}
        {!loading && filteredStudents.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-50">
            <Users size={64} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-400 font-black text-xl">لا يوجد طلاب في هذا المجلد حالياً.</p>
            <button onClick={handleOpenAdd} className="mt-4 text-indigo-600 font-bold hover:underline">أضف طالبك الأول الآن</button>
          </div>
        )}
      </div>

      {/* Move/Copy Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 text-right">
            <button onClick={() => setIsMoveModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-2 text-slate-900">نقل / نسخ الطالب</h2>
            <p className="text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest">اختر السنة والفصل الدراسي الجديد</p>
            
            <div className="space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                <button onClick={() => setMoveData({...moveData, action: 'move'})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${moveData.action === 'move' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>نقل (Move)</button>
                <button onClick={() => setMoveData({...moveData, action: 'copy'})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${moveData.action === 'copy' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>نسخ (Copy)</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">السنة الدراسية</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 appearance-none" value={moveData.year} onChange={e => setMoveData({...moveData, year: e.target.value})}>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الفصل الدراسي</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 appearance-none" value={moveData.semester} onChange={e => setMoveData({...moveData, semester: e.target.value})}>
                    <option value="1">الفصل الأول</option>
                    <option value="2">الفصل الثاني</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 leading-relaxed italic">
                  * ملحوظة: عند "النقل" سيختفي الطالب من الفترة الحالية. عند "النسخ" سيتم إنشاء سجل جديد للطالب في الفترة المختارة.
                </p>
              </div>

              <button 
                onClick={handleMoveCopy}
                disabled={isSubmitting}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                تأكيد العملية الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-xl p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] text-right">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-colors"><X size={28}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900 flex items-center gap-4">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                {isEditMode ? <Edit3 size={24}/> : <Plus size={24}/>}
              </div>
              {isEditMode ? "تعديل بيانات الطالب" : "تسجيل طالب جديد"}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الكامل</label>
                  <input required placeholder="محمد أحمد..." className="w-full p-5 bg-slate-50 border rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">الصف الدراسي</label>
                  <select className="w-full p-5 bg-slate-50 border rounded-2xl font-bold appearance-none outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="10">الصف العاشر (10)</option>
                    <option value="11">الصف الحادي عشر (11)</option>
                    <option value="12">الصف الثاني عشر (12)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">اسم المدرسة</label>
                  <input placeholder="المدرسة.." className="w-full p-5 bg-slate-50 border rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">العنوان أو السكن</label>
                  <input placeholder="المنطقة - الشارع" className="w-full p-5 bg-slate-50 border rounded-2xl font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black text-indigo-900 flex items-center gap-2"><Phone size={16}/> أرقام هواتف التواصل</label>
                  <button type="button" onClick={() => setForm({...form, phones: [...form.phones, {number: '', label: 'الطالب'}]})} className="text-indigo-600 font-black text-[10px] hover:bg-white px-3 py-1.5 rounded-full shadow-sm transition-all">+ إضافة هاتف آخر</button>
                </div>
                {form.phones.map((p, idx) => (
                  <div key={idx} className="flex gap-2 animate-in slide-in-from-right-2">
                    <select className="w-32 p-4 bg-white border rounded-2xl font-bold text-xs outline-none shadow-sm" value={p.label} onChange={e => updatePhone(idx, 'label', e.target.value)}>
                      <option value="الطالب">الطالب</option>
                      <option value="الأب">الأب</option>
                      <option value="الأم">الأم</option>
                    </select>
                    <input required placeholder="رقم الموبايل" className="flex-1 p-4 bg-white border rounded-2xl font-bold text-xs text-left outline-none shadow-sm" value={p.number} onChange={e => updatePhone(idx, 'number', e.target.value)} />
                    {idx > 0 && <button type="button" onClick={() => setForm({...form, phones: form.phones.filter((_, i) => i !== idx)})} className="text-rose-500 p-3 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100 group cursor-pointer" onClick={() => setForm({...form, is_hourly: !form.is_hourly})}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${form.is_hourly ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                  {form.is_hourly && <CheckCircle size={14} />}
                </div>
                <label className="text-sm font-black text-indigo-700 cursor-pointer select-none">نظام المحاسبة بالساعة (نظام خارجي)</label>
              </div>

              <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">{form.is_hourly ? 'سعر الساعة الدراسية' : 'المبلغ المتفق عليه للفصل'}</label>
                   <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-3xl group-focus-within:text-indigo-500/50 transition-colors">$</span>
                     <input 
                      required 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] font-black text-4xl text-white outline-none focus:border-indigo-500 transition-all text-center placeholder:text-white/10" 
                      value={form.is_hourly ? form.price_per_hour : form.agreed_amount} 
                      onChange={e => setForm({...form, [form.is_hourly ? 'price_per_hour' : 'agreed_amount']: e.target.value})} 
                     />
                   </div>
                </div>
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] mt-10 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 text-lg">
              {isSubmitting ? <RefreshCw className="animate-spin" size={24} /> : (isEditMode ? <Save size={24} /> : <CheckCircle size={24} />)}
              {isSubmitting ? "جاري الحفظ..." : (isEditMode ? "حفظ التغييرات" : "تأكيد تسجيل الطالب")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
