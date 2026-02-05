import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, Trash2, CheckCircle, X, AlertCircle, Users, School, MessageCircle, 
  Phone, MapPin, Search, Folder, FolderOpen, Layers, RefreshCw, MoreVertical, 
  Edit3, Copy, MoveRight, Settings2, Save, Lock, Unlock, CheckCircle2
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
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: '', address: '', school_name: '', grade: '12', 
    agreed_amount: '', is_hourly: false, price_per_hour: '',
    phones: [{ number: '', label: 'الطالب' }] as any[]
  });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
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
      console.error("Fetch students error:", e);
      showFeedback(`خطأ في جلب البيانات: ${e.message || 'فشل الاتصال'}`, "error");
    } finally { 
      setLoading(false); 
    }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleToggleCompleted = async (studentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('students').update({ is_completed: !currentStatus }).eq('id', studentId);
      if (error) throw error;
      showFeedback(!currentStatus ? "تم قفل ملف الطالب بنجاح" : "تم إعادة فتح ملف الطالب");
      fetchStudents();
      setActiveMenu(null);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validPhones = form.phones.filter(p => p.number.trim() !== '');
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

      let operation;
      if (isEditMode && selectedStudentId) {
        operation = supabase.from('students').update(studentData).eq('id', selectedStudentId);
      } else {
        operation = supabase.from('students').insert([studentData]);
      }
      
      const { error } = await operation;

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message);
      }
      
      showFeedback(isEditMode ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { 
      showFeedback(`فشل الحفظ: ${err.message}`, 'error'); 
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('تنبيه: سيتم حذف كافة البيانات المالية والدروس نهائياً. هل أنت متأكد؟')) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      showFeedback('تم حذف الطالب نهائياً');
      fetchStudents();
    } catch (err: any) { showFeedback(err.message, 'error'); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === 'الكل' || s.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, selectedGrade]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100"><Layers size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">سجل الطلاب</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">إدارة شاملة للملفات الأكاديمية</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              placeholder="ابحث عن اسم طالب..." 
              className="w-full pr-12 pl-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => { setIsEditMode(false); setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 active:scale-95 transition-all text-sm"><Plus size={20}/> إضافة طالب</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {['الكل', '10', '11', '12'].map(grade => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`flex-1 min-w-[140px] p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${
              selectedGrade === grade ? 'border-indigo-600 bg-white shadow-2xl -translate-y-2' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
            }`}
          >
            <div className={`p-4 rounded-[1.5rem] ${selectedGrade === grade ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 shadow-sm'}`}>
              {selectedGrade === grade ? <FolderOpen size={24} /> : <Folder size={24} />}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest ${selectedGrade === grade ? 'text-indigo-600' : 'text-slate-400'}`}>
              {grade === 'الكل' ? 'كافة المراحل' : `الصف ${grade}`}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" size={48} /></div>
        ) : filteredStudents.map(s => (
          <div 
            key={s.id} 
            role="button"
            tabIndex={0}
            onClick={() => navigate('/lessons', { state: { studentToOpen: s } })}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/lessons', { state: { studentToOpen: s } }); }}
            className={`cursor-pointer bg-white p-8 rounded-[3.5rem] border transition-all duration-500 shadow-sm group hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${s.is_completed ? 'opacity-70 border-emerald-100 bg-emerald-50/10' : 'border-slate-100'}`}
          >
            
            {s.is_completed && (
              <div className="absolute top-0 left-0 bg-emerald-500 text-white px-6 py-2 rounded-br-[2rem] text-[9px] font-black z-10 flex items-center gap-2">
                <CheckCircle2 size={12}/> تم الإنجاز
              </div>
            )}

            <div className="absolute top-8 left-8 z-20">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === s.id ? null : s.id) }}
                className={`p-3 rounded-2xl transition-all ${activeMenu === s.id ? 'bg-slate-900 text-white shadow-xl rotate-90' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-indigo-600'}`}
              >
                <Settings2 size={20} />
              </button>
              
              {activeMenu === s.id && (
                <div className="absolute left-0 mt-3 w-56 bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 py-3 z-[100] overflow-hidden animate-in zoom-in duration-200">
                  <button onClick={(e) => { e.stopPropagation(); setIsEditMode(true); setSelectedStudentId(s.id); setForm({ ...s, agreed_amount: s.agreed_amount.toString(), price_per_hour: s.price_per_hour.toString() }); setIsModalOpen(true); setActiveMenu(null); }} className="w-full px-6 py-4 text-right hover:bg-indigo-50 text-slate-700 font-black text-xs flex items-center justify-between group/item transition-colors">
                    <span>تعديل الملف</span>
                    <Edit3 size={16} className="text-slate-300 group-hover/item:text-indigo-600" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleToggleCompleted(s.id, s.is_completed); }} className={`w-full px-6 py-4 text-right font-black text-xs flex items-center justify-between group/item transition-colors ${s.is_completed ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}>
                    <span>{s.is_completed ? 'إعادة فتح الملف' : 'إتمام وقفل الملف'}</span>
                    {s.is_completed ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                  <div className="h-px bg-slate-50 my-2 mx-6"></div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s.id); }} className="w-full px-6 py-4 text-right hover:bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-between group/item transition-colors">
                    <span>حذف نهائي</span>
                    <Trash2 size={16} className="text-rose-300" />
                  </button>
                </div>
              )}
            </div>

            <div className="mb-8 mt-4">
               <h3 className="text-2xl font-black text-slate-900 mb-3">{s.name}</h3>
               <div className="flex flex-wrap gap-2">
                 <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black">الصف {s.grade}</span>
                 {s.school_name && <span className="bg-slate-50 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2"><School size={12}/> {s.school_name}</span>}
               </div>
            </div>
            
            <div className="space-y-3 mb-8">
              {s.phones?.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-black text-slate-500 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                  <span className="flex items-center gap-3">
                    <span className="text-indigo-400 opacity-50"><Phone size={14}/></span>
                    {p.label}: {p.number}
                  </span>
                  <a href={`https://wa.me/${p.number.replace(/\s/g, '')}`} target="_blank" onClick={(e) => e.stopPropagation()} className="text-emerald-500 hover:scale-110 transition-transform"><MessageCircle size={18} fill="currentColor" fillOpacity={0.1}/></a>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">المبلغ المتبقي</p>
                <p className={`text-2xl font-black ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  ${s.remaining_balance.toLocaleString()}
                </p>
              </div>
              <div className="text-left">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">نوع المحاسبة</p>
                 <p className="text-[11px] font-black text-slate-800">{s.is_hourly ? 'خارجي (ساعة)' : 'اتفاق فصلي'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-xl p-12 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] text-right border border-white/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-12 left-12 text-slate-300 hover:text-rose-500 transition-all hover:rotate-90"><X size={32}/></button>
            <h2 className="text-3xl font-black mb-10 text-slate-900 flex items-center gap-5">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-2xl shadow-indigo-100">
                {isEditMode ? <Edit3 size={28}/> : <Plus size={28}/>}
              </div>
              {isEditMode ? "تعديل الملف" : "تسجيل طالب جديد"}
            </h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">الاسم بالكامل</label>
                  <input required placeholder="الاسم ثلاثي..." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">الصف الدراسي</label>
                  <select className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black appearance-none outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="10">العاشر</option>
                    <option value="11">الحادي عشر</option>
                    <option value="12">الثاني عشر</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">اسم المدرسة (اختياري)</label>
                   <input placeholder="المدرسة..." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">عنوان السكن (اختياري)</label>
                   <input placeholder="المنطقة..." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">أرقام الهواتف</label>
                {form.phones.map((phone, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input 
                      placeholder="رقم الهاتف..." 
                      className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all text-left" 
                      value={phone.number} 
                      onChange={e => {
                        const newPhones = [...form.phones];
                        newPhones[index].number = e.target.value;
                        setForm({...form, phones: newPhones});
                      }}
                    />
                    <select 
                      className="p-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs"
                      value={phone.label}
                      onChange={e => {
                        const newPhones = [...form.phones];
                        newPhones[index].label = e.target.value;
                        setForm({...form, phones: newPhones});
                      }}
                    >
                      <option>الطالب</option>
                      <option>الأب</option>
                      <option>الأم</option>
                    </select>
                    {form.phones.length > 1 && (
                      <button type="button" onClick={() => setForm({...form, phones: form.phones.filter((_, i) => i !== index)})} className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><Trash2 size={20}/></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({...form, phones: [...form.phones, {number: '', label: 'الطالب'}]})} className="text-indigo-600 font-black text-xs">+ إضافة رقم آخر</button>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <input type="checkbox" id="is_hourly" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  <label htmlFor="is_hourly" className="font-black text-slate-700">محاسبة خارجية (بالساعة)</label>
                </div>
                
                {form.is_hourly ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">سعر الساعة</label>
                    <input type="number" placeholder="0" className="w-full p-5 bg-white border-2 border-slate-200 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-[0.2em]">المبلغ المتفق عليه للفصل الدراسي</label>
                    <input type="number" placeholder="0" className="w-full p-5 bg-white border-2 border-slate-200 rounded-3xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  </div>
                )}
              </div>
            </div>

            <button disabled={isSubmitting} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] mt-10 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
              {isEditMode ? 'حفظ التعديلات' : 'تسجيل وحفظ الملف'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;