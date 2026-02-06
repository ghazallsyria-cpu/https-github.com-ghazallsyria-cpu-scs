
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Fix: Use standard v6 hook from react-router-dom
// @ts-ignore: useNavigate might not be seen as exported in this environment
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, CheckCircle, AlertCircle, Users, 
  Phone, Search, RefreshCw, ChevronLeft, Save, 
  Settings, UserCheck, Link as LinkIcon, Briefcase
} from 'lucide-react';

const Students = ({ isAdmin, role, uid, year, semester }: { isAdmin: boolean, role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade] = useState<string>('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' as any }] });
  const [existingStudentFound, setExistingStudentFound] = useState<any>(null);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (role !== 'admin') query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;

      if (role === 'admin') {
        // ذكاء المدير: تجميع الطلاب حسب رقم الهاتف الموحد (Primary Phone)
        const consolidatedMap = new Map();
        data?.forEach(s => {
          const key = s.primary_phone || s.id;
          if (consolidatedMap.has(key)) {
            const existing = consolidatedMap.get(key);
            existing.is_consolidated = true;
            existing.total_paid += s.total_paid;
            existing.remaining_balance += s.remaining_balance;
            existing.total_lessons += s.total_lessons;
            // دمج المعلمين
            const teacherSet = new Set([...existing.teachers.map((t:any)=>t.id), s.teacher_id]);
            if (teacherSet.size > existing.teachers.length) {
                existing.teachers.push({id: s.teacher_id, name: s.teacher_name});
            }
          } else {
            consolidatedMap.set(key, { ...s, teachers: [{id: s.teacher_id, name: s.teacher_name}], is_consolidated: false });
          }
        });
        setStudents(Array.from(consolidatedMap.values()));
      } else {
        setStudents(data || []);
      }
    } catch (e: any) { showFeedback(`خطأ: ${e.message}`, "error"); } finally { setLoading(false); }
  }, [uid, role, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const checkExistingStudent = async (phone: string) => {
    if (phone.length < 8) return;
    const { data } = await supabase.from('students').select('*, profiles(full_name)').contains('phones', [{ number: phone }]).limit(1);
    if (data && data.length > 0) {
      setExistingStudentFound(data[0]);
      if (!isEditMode) {
        setForm(prev => ({ ...prev, name: data[0].name, address: data[0].address || '', school_name: data[0].school_name || '', grade: data[0].grade }));
      }
    } else { setExistingStudentFound(null); }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const studentData = { name: form.name.trim(), grade: form.grade, phones: form.phones, agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0), is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0, teacher_id: uid, academic_year: year, semester: semester, address: form.address, school_name: form.school_name };
      if (isEditMode && selectedStudentId) await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      else await supabase.from('students').insert([studentData]);
      setIsModalOpen(false); fetchStudents();
      showFeedback("تم الحفظ والربط بنجاح");
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setIsSubmitting(false); }
  };

  const filteredStudents = useMemo(() => students.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && (selectedGrade === 'الكل' || s.grade === selectedGrade)), [students, searchTerm, selectedGrade]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-right font-['Cairo'] pb-32">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black bg-indigo-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-12 lg:p-16 rounded-[5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-10 z-10">
           <div className="bg-indigo-600 p-8 rounded-[2.8rem] text-white shadow-2xl rotate-6 transition-all duration-700"><Users size={44}/></div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">سجل الطلاب {isAdmin ? '(الهوية الرقمية)' : ''}</h1>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">إدارة {students.length} هوية طلابية فريدة</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 w-full md:w-auto z-10">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            <input placeholder="ابحث بالاسم أو الهاتف..." className="w-full pr-16 pl-8 py-5 bg-slate-50 rounded-[2rem] font-black border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '', is_hourly: false, price_per_hour: '', phones: [{ number: '', label: 'الطالب' }] }); setIsEditMode(false); setExistingStudentFound(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
            <Plus size={24} /> إضافة طالب
