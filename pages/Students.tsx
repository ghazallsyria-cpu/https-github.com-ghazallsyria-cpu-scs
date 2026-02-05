import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, Trash2, CheckCircle, X, AlertCircle, Users, MessageCircle, 
  Phone, Search, Folder, FolderOpen, RefreshCw, ChevronRight, Save, Settings
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
      if (role !== 'admin') {
        query = query.eq('teacher_id', uid);
      }
      const { data, error } = await query.order('is_completed', { ascending: true }).order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e: any) { 
      showFeedback(`فشل تحميل سجل الطلاب: ${e.message}`, "error");
    } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // التحقق من صحة مصفوفة الهواتف
      const validPhones = Array.isArray(form.phones) ? form.phones.filter(p => p && p.number) : [];
      
      const studentData = { 
        name: form.name.trim(), 
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

      let result;
      if (isEditMode && selectedStudentId) {
        result = await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      } else {
        result = await supabase.from('students').insert([studentData]);
      }
      
      if (result.error) throw result.error;
      
      showFeedback(isEditMode ? 'تم تحديث البيانات بنجاح' : 'تمت إضافة الطالب بنجاح');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { 
      console.error("Save error:", err);
      showFeedback(`فشلت العملية: ${err.message || 'خطأ غير معروف'}`, 'error'); 
    } finally { setIsSubmitting(false); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === 'الكل' || s.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, selectedGrade]);

  const handleOpenEdit = (s: any) => {
    setSelectedStudentId(s.id);
    setForm({ 
      ...s, 
      agreed_amount: (s.agreed_amount || 0).toString(), 
      price_per_hour: (s.price_per_hour || 0).toString(),
      phones: Array.isArray(s.phones) ? s.phones : [{ number: '', label: 'الطالب' }]
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-right pb-24">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black transition-all animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Search & Actions */}
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8">
           <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl scale-110"><Users size={32}/></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900">سجل الطلاب</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">إدارة قاعدة البيانات الطلابية</p>
           </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
            <input placeholder="ابحث عن طالب..." className="w-full pr-16 pl-6 py-5 bg-slate-50 border-none rounded-3xl font-black focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black shadow-2xl transition-all flex items-center gap-4 active:scale-95"><Plus size={22}/> إضافة طالب</button>
        </div>
      </div>

      {/* Grade Folders */}
      <div className="flex flex-wrap gap-6">
        {['الكل', '10', '11', '12'].map(grade => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`flex-1 min-w-[150px] p-8 rounded-[3rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 ${
              selectedGrade === grade ? 'border-indigo-600 bg-white shadow-2xl -translate-y-2' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 text-slate-400'
            }`}
          >
            <div className={`p-5 rounded-3xl transition-all ${selectedGrade === grade ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white shadow-sm'}`}>
              {selectedGrade === grade ? <FolderOpen size={30} /> : <Folder size={30} />}
            </div>
            <span className="text-[12px] font-black uppercase tracking-widest">
              {grade === 'الكل' ? 'كافة المراحل' : `الصف ${grade}`}
            </span>
          </button>
        ))}
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-24 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" size={56} /></div>
        ) : filteredStudents.length > 0 ? filteredStudents.map(s => (
          <div 
            key={s.id} 
            className={`bg-white p-10 rounded-[4.5rem] border-2 transition-all duration-700 shadow-sm hover:shadow-2xl hover:-translate-y-3 group relative overflow-hidden ${s.is_completed ? 'opacity-60 grayscale' : 'border-white hover:border-indigo-500'}`}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="cursor-pointer overflow-hidden" onClick={() => navigate('/lessons', { state: { studentToOpen: s } })}>
                 <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 leading-tight truncate">{s.name}</h3>
                 <span className="bg-indigo-50 text-indigo-600 px-6 py-1.5 rounded-full text-[10px] font-black tracking-widest">الصف {s.grade}</span>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleOpenEdit(s)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                   <Settings size={18}/>
                 </button>
              </div>
            </div>

            <div className="space-y-4 mb-10">
               {Array.isArray(s.phones) && s.phones.map((p: any, i: number) => (
                 <div key={i} className="flex justify-between items-center text-[10px] font-black text-slate-500 bg-slate-50/50 p-4 rounded-3xl">
                    <span>{p.label}: {p.number}</span>
                    <Phone size={14} className="text-indigo-400" />
                 </div>
               ))}
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-between items-end">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">المبلغ المتبقي</p>
                  <p className={`text-2xl font-black tracking-tighter ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ${(s.remaining_balance || 0).toLocaleString()}
                  </p>
               </div>
               <div onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className="bg-slate-900 text-white p-5 rounded-[2rem] group-hover:bg-indigo-600 transition-all shadow-xl cursor-pointer">
                 <ChevronRight size={22} className="rotate-180" />
               </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center">
            <Users size={64} className="mx-auto text-slate-200 mb-6" />
            <p className="text-slate-400 font-black text-xl italic">لا يوجد طلاب في هذه المرحلة حالياً</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-3xl z-[200] flex items-center justify-center p-6 text-right">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-2xl p-10 lg:p-14 rounded-[4rem] lg:rounded-[5rem] shadow-2xl relative animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all hover:rotate-90"><X size={32}/></button>
            <h2 className="text-3xl font-black mb-10 text-slate-900 flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-2xl"><Plus size={24}/></div>
              {isEditMode ? 'تعديل البيانات' : 'تسجيل طالب جديد'}
            </h2>
            
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الثلاثي</label>
                    <input required placeholder="الاسم الكامل..." className="w-full p-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">المرحلة الدراسية</label>
                    <select className="w-full p-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none appearance-none cursor-pointer text-sm" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       <option value="10">الصف العاشر</option>
                       <option value="11">الحادي عشر</option>
                       <option value="12">الثاني عشر</option>
                    </select>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">أرقام التواصل</label>
                  {form.phones.map((phone, index) => (
                    <div key={index} className="flex gap-4">
                       <input placeholder="الرقم..." className="flex-1 p-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none text-left tracking-widest text-sm" value={phone.number} onChange={e => {
                         const n = [...form.phones]; n[index].number = e.target.value; setForm({...form, phones: n});
                       }} />
                       <select className="p-5 bg-slate-50 border-none rounded-[2rem] font-black text-[11px]" value={phone.label} onChange={e => {
                         const n = [...form.phones]; n[index].label = e.target.value; setForm({...form, phones: n});
                       }}>
                          <option>الطالب</option><option>الأب</option><option>الأم</option>
                       </select>
                    </div>
                  ))}
               </div>

               <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6 border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="hourly" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-6 h-6 accent-indigo-600 rounded-lg cursor-pointer" />
                    <label htmlFor="hourly" className="font-black text-slate-700 text-base cursor-pointer select-none">نظام المحاسبة بالساعة (خارجي)</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة..." className="w-full p-5 bg-white border-none rounded-[2rem] font-black outline-none shadow-sm text-center text-2xl text-indigo-600" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="المبلغ الإجمالي المتفق عليه..." className="w-full p-5 bg-white border-none rounded-[2rem] font-black outline-none shadow-sm text-center text-2xl text-slate-900" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
            </div>

            <button disabled={isSubmitting} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] mt-10 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 text-lg">
              {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={24}/>}
              {isEditMode ? 'حفظ التعديلات' : 'تأكيد التسجيل'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;