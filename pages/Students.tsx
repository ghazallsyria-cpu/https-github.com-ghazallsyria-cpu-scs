import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, Trash2, CheckCircle, X, AlertCircle, Users, School, MessageCircle, 
  Phone, MapPin, Search, Folder, FolderOpen, Layers, RefreshCw, MoreVertical, 
  Edit3, Copy, MoveRight, Settings2, Save, Lock, Unlock, CheckCircle2, ChevronLeft, ChevronRight
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
      showFeedback(`فشل الاتصال بالقاعدة الجديدة: ${e.message}`, "error");
    } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const studentData = { 
        name: form.name, address: form.address, school_name: form.school_name, grade: form.grade,
        phones: form.phones.filter(p => p.number),
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
        teacher_id: uid, academic_year: year, semester: semester
      };

      if (isEditMode && selectedStudentId) {
        await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      } else {
        await supabase.from('students').insert([studentData]);
      }
      
      showFeedback(isEditMode ? 'تم تحديث ملف الطالب' : 'تمت إضافة الطالب بنجاح');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { 
      showFeedback(`خطأ أثناء الحفظ: ${err.message}`, 'error'); 
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد؟ سيتم مسح كافة حصص ومدفوعات الطالب نهائياً.')) return;
    try {
      await supabase.from('students').delete().eq('id', studentId);
      showFeedback('تم حذف السجل');
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
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-700 text-right font-['Cairo'] pb-20">
      
      {/* Search & Actions Bar */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-indigo-100"><Users size={28}/></div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">سجل الطلاب</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">إدارة المحتوى التعليمي - النسخة V15</p>
           </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input placeholder="ابحث عن اسم طالب..." className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 active:scale-95 transition-all text-sm"><Plus size={18}/> إضافة طالب</button>
        </div>
      </div>

      {/* Modern Folders Filter */}
      <div className="flex flex-wrap gap-4">
        {['الكل', '10', '11', '12'].map(grade => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`flex-1 min-w-[120px] p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 ${
              selectedGrade === grade ? 'border-indigo-600 bg-white shadow-xl -translate-y-1' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 text-slate-400'
            }`}
          >
            <div className={`p-4 rounded-2xl ${selectedGrade === grade ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white shadow-sm'}`}>
              {selectedGrade === grade ? <FolderOpen size={24} /> : <Folder size={24} />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {grade === 'الكل' ? 'كافة الطلاب' : `الصف ${grade}`}
            </span>
          </button>
        ))}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" size={40} /></div>
        ) : filteredStudents.map(s => (
          <div 
            key={s.id} 
            onClick={() => navigate('/lessons', { state: { studentToOpen: s } })}
            className={`cursor-pointer bg-white p-8 rounded-[3.5rem] border-2 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden ${s.is_completed ? 'opacity-60 border-slate-100' : 'border-white hover:border-indigo-500'}`}
          >
            {s.is_completed && <div className="absolute top-0 left-0 bg-slate-900 text-white px-6 py-2 rounded-br-3xl text-[9px] font-black">أرشيف مكتمل</div>}
            
            <div className="mb-8">
               <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{s.name}</h3>
               <div className="flex gap-2">
                 <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black tracking-widest">الصف {s.grade}</span>
                 {s.school_name && <span className="bg-slate-50 text-slate-400 px-4 py-1 rounded-full text-[10px] font-bold truncate max-w-[150px]">{s.school_name}</span>}
               </div>
            </div>

            <div className="space-y-3 mb-10">
               {s.phones?.map((p: any, i: number) => (
                 <div key={i} className="flex justify-between items-center text-[10px] font-black text-slate-500 bg-slate-50/50 p-4 rounded-2xl hover:bg-indigo-50 transition-colors">
                    <span>{p.label}: {p.number}</span>
                    <MessageCircle size={16} className="text-emerald-500" />
                 </div>
               ))}
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">المتبقي للتحصيل</p>
                  <p className={`text-2xl font-black ${s.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ${s.remaining_balance.toLocaleString()}
                  </p>
               </div>
               <div className="bg-slate-900 text-white p-3 rounded-2xl group-hover:bg-indigo-600 transition-colors">
                 {/* Fix: 'ChevronRight' added to imports */}
                 <ChevronRight size={18} className="rotate-180" />
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-xl p-12 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-transform hover:rotate-90"><X size={32}/></button>
            <h2 className="text-3xl font-black mb-10 text-slate-900 flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Plus size={24}/></div>
              {isEditMode ? 'تعديل البيانات' : 'تسجيل طالب جديد'}
            </h2>
            
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الكامل</label>
                    <input required placeholder="الاسم ثلاثي..." className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">الصف</label>
                    <select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all appearance-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                       <option value="10">الصف العاشر</option>
                       <option value="11">الحادي عشر</option>
                       <option value="12">الثاني عشر</option>
                    </select>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-4 uppercase tracking-widest">أرقام التواصل</label>
                  {form.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                       <input placeholder="رقم الموبايل" className="flex-1 p-5 bg-slate-50 border-none rounded-3xl font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-left" value={phone.number} onChange={e => {
                         const n = [...form.phones]; n[index].number = e.target.value; setForm({...form, phones: n});
                       }} />
                       <select className="p-5 bg-slate-50 border-none rounded-3xl font-black outline-none focus:bg-white transition-all text-xs" value={phone.label} onChange={e => {
                         const n = [...form.phones]; n[index].label = e.target.value; setForm({...form, phones: n});
                       }}>
                          <option>الطالب</option><option>الأب</option><option>الأم</option>
                       </select>
                    </div>
                  ))}
               </div>

               <div className="p-8 bg-slate-50 rounded-[3rem] space-y-4 border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" id="hourly" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded-lg" />
                    <label htmlFor="hourly" className="font-black text-slate-700">نظام المحاسبة بالساعة (خارجي)</label>
                  </div>
                  {form.is_hourly ? (
                    <input type="number" placeholder="سعر الساعة..." className="w-full p-5 bg-white border-none rounded-3xl font-black outline-none shadow-sm" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  ) : (
                    <input type="number" placeholder="المبلغ الإجمالي المتفق عليه..." className="w-full p-5 bg-white border-none rounded-3xl font-black outline-none shadow-sm" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  )}
               </div>
            </div>

            <button disabled={isSubmitting} className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] mt-10 shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={20}/>}
              {isEditMode ? 'حفظ التغييرات' : 'تأكيد التسجيل'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;