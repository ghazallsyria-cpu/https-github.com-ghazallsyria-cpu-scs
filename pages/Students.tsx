
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, Folder, 
  GraduationCap, Trash2, Edit3, 
  ChevronRight, X, Clock, Copy, 
  Phone, DollarSign, BookOpen, Save, MoveHorizontal, AlertTriangle, User, RefreshCw, ChevronDown
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
      
      // تلقائياً توسيع كافة الصفوف في البداية
      // Fix: cast to string[] to match state type
      const grades = Array.from(new Set((data || []).map(s => String(s.grade)))) as string[];
      setExpandedGrades(grades);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, profile.id]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]);
  };

  const handleAction = async (type: string) => {
    setIsProcessing(true);
    try {
      if (type === 'save_student') {
        const payload = { 
          name: form.name,
          grade: form.grade,
          group_name: form.group_name,
          address: form.address,
          academic_year: form.academic_year,
          semester: form.semester,
          agreed_amount: parseFloat(form.agreed_amount || '0'),
          is_hourly: form.is_hourly,
          price_per_hour: parseFloat(form.price_per_hour || '0'),
          phones: form.phones,
          teacher_id: profile.id
        };
        
        if (selectedStudent) {
          await supabase.from('students').update(payload).eq('id', selectedStudent.id);
        } else {
          await supabase.from('students').insert([payload]);
        }
      } else if (type === 'delete_student') {
        await supabase.from('lessons').delete().eq('student_id', selectedStudent.id);
        await supabase.from('payments').delete().eq('student_id', selectedStudent.id);
        await supabase.from('schedules').delete().eq('student_id', selectedStudent.id);
        await supabase.from('students').delete().eq('id', selectedStudent.id);
      }
      
      setActiveModal(null);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (type: any, student: any = null) => {
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

  // تجميع الطلاب حسب الصف الدراسي (المجلدات)
  const groupedStudents = students.reduce((acc, s) => {
    if (!acc[s.grade]) acc[s.grade] = [];
    acc[s.grade].push(s);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-10 pb-32">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><Users size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">إدارة <span className="text-indigo-600">الطلاب</span></h2>
            <p className="text-slate-400 font-bold">تجميع الطلاب في مجلدات حسب الصف الدراسي.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
             <input placeholder="بحث باسم الطالب..." className="w-full pr-12 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-2 ring-indigo-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => openModal('edit')} className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-indigo-600 transition-all whitespace-nowrap">
             <Plus size={20} /> إضافة طالب
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-indigo-600" size={40} /></div>
        ) : Object.keys(groupedStudents).sort((a,b) => Number(b)-Number(a)).map(grade => (
          <div key={grade} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
            <button 
              onClick={() => toggleGrade(grade)}
              className="w-full p-8 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Folder size={28} fill="currentColor" /></div>
                 <div className="text-right">
                    <h3 className="text-2xl font-black text-slate-900">طلاب الصف {grade}</h3>
                    <p className="text-sm font-bold text-slate-400">إجمالي الطلاب: {groupedStudents[grade].length}</p>
                 </div>
              </div>
              <ChevronDown className={`text-slate-300 transition-transform duration-500 ${expandedGrades.includes(grade) ? 'rotate-180' : ''}`} size={28} />
            </button>

            {expandedGrades.includes(grade) && (
              <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                {groupedStudents[grade].filter((s: any) => s.name.includes(searchTerm)).map((s: any) => (
                  <div key={s.id} className="p-8 bg-slate-50 rounded-[3rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm">{s.name[0]}</div>
                       <div className="flex gap-2">
                          <button onClick={() => openModal('edit', s)} className="p-3 bg-white text-slate-400 rounded-xl hover:text-indigo-600 hover:shadow-md transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => openModal('confirm_delete', s)} className="p-3 bg-white text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                       </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{s.name}</h4>
                    {s.group_name && <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full mb-4 uppercase">{s.group_name}</p>}
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                       <div className="bg-white p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 block mb-1">المتبقي</span>
                          <span className={`text-lg font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance}</span>
                       </div>
                       <div className="bg-white p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 block mb-1">الحصص</span>
                          <span className="text-lg font-black text-slate-900">{s.total_lessons}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-2xl p-12 rounded-[4rem] shadow-2xl space-y-8 animate-in zoom-in overflow-y-auto max-h-[90vh] no-scrollbar text-right">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-black">{selectedStudent ? 'تعديل طالب' : 'طالب جديد'}</h3>
                 <button onClick={() => setActiveModal(null)} className="p-4 bg-slate-100 rounded-full"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-sm font-black">الاسم الثلاثي</label><input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-black">الصف الدراسي</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="12">الثاني عشر</option><option value="11">الحادي عشر</option><option value="10">العاشر</option><option value="9">التاسع</option>
                  </select>
                </div>
                <div className="space-y-2"><label className="text-sm font-black">اسم المجموعة (المجلد)</label><input placeholder="مثال: مجموعة التقوية" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.group_name} onChange={e => setForm({...form, group_name: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-black">رقم هاتف الطالب/ولي الأمر</label><input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-left" value={form.phones[0].number} onChange={e => {
                  const n = [...form.phones]; n[0].number = e.target.value; setForm({...form, phones: n});
                }} /></div>
                <div className="space-y-2"><label className="text-sm font-black">المبلغ الكلي المتفق عليه</label><input type="number" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-black">الفصل الدراسي</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                    <option value="1">الفصل الأول</option><option value="2">الفصل الثاني</option>
                  </select>
                </div>
              </div>

              <button onClick={() => handleAction('save_student')} disabled={isProcessing} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                {isProcessing ? <RefreshCw className="animate-spin" /> : <Save />} {selectedStudent ? 'حفظ البيانات' : 'إضافة الطالب الآن'}
              </button>
           </div>
        </div>
      )}

      {activeModal === 'confirm_delete' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white p-12 rounded-[4rem] max-w-md text-center space-y-8 animate-in zoom-in">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><AlertTriangle size={40} /></div>
              <h3 className="text-2xl font-black">تأكيد حذف الطالب؟</h3>
              <div className="flex gap-4">
                 <button onClick={() => setActiveModal(null)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">تراجع</button>
                 <button onClick={() => handleAction('delete_student')} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg">حذف نهائي</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
