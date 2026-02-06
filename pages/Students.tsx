import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  Plus, CheckCircle, AlertCircle, Users, 
  Phone, Search, RefreshCw, ChevronLeft, Save, 
  Settings, UserCheck, X, Award, ShieldCheck,
  User, Filter, Briefcase
} from 'lucide-react';

const Students = ({ isAdmin, role, uid, year, semester }: { isAdmin: boolean, role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherFilter, setTeacherFilter] = useState('الكل');
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: '', address: '', school_name: '', grade: '12', 
    agreed_amount: '', is_hourly: false, price_per_hour: '', 
    phones: [{ number: '', label: 'الطالب' as any }] 
  });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*, profiles:teacher_id(full_name)').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);

      if (isAdmin) {
        const { data: tData } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        setTeachers(tData || []);
      }
    } catch (e: any) { showFeedback(`خطأ: ${e.message}`, "error"); } finally { setLoading(false); }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) return;
    setIsSubmitting(true);
    try {
      const studentData = { 
        name: form.name.trim(), grade: form.grade, phones: form.phones, 
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0), 
        is_hourly: form.is_hourly, 
        price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0, 
        teacher_id: uid, academic_year: year, semester: semester, 
        address: form.address, school_name: form.school_name 
      };
      if (isEditMode && selectedStudentId) await supabase.from('students').update(studentData).eq('id', selectedStudentId);
      else await supabase.from('students').insert([studentData]);
      setIsModalOpen(false); fetchStudents();
      showFeedback("تم حفظ بيانات الطالب بنجاح");
    } catch (err: any) { showFeedback(err.message, 'error'); } finally { setIsSubmitting(false); }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeacher = teacherFilter === 'الكل' || s.teacher_id === teacherFilter;
      return matchesSearch && matchesTeacher;
    });
  }, [students, searchTerm, teacherFilter]);

  return (
    <div className="space-y-12 pb-32">
      {feedback && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 font-black bg-indigo-600 text-white animate-in slide-in-from-top-4">
          <span>{feedback.msg}</span>
        </div>
      )}
      <div className={`p-10 md:p-16 rounded-[4rem] border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10 ${isAdmin ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
        <div className="flex items-center gap-8">
           <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl"><Users size={40}/></div>
           <div>
              <h1 className="text-3xl font-black">{isAdmin ? 'دليل الطلاب المركزي' : 'سجل طلابي'}</h1>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 w-full md:w-auto">
          {isAdmin && (
            <select className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl font-black text-sm text-indigo-200" value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}>
                <option value="الكل">كل المعلمين</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          )}
          <input placeholder="البحث..." className={`px-6 py-5 rounded-[2rem] font-black outline-none ${isAdmin ? 'bg-white/5 text-white' : 'bg-slate-50'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {!isAdmin && <button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black">طالب جديد</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? <RefreshCw className="animate-spin text-indigo-600 mx-auto" /> : filteredStudents.map(s => (
          <div key={s.id} className="p-8 bg-white rounded-[3.5rem] border shadow-sm">
             <h3 className="text-2xl font-black">{s.name}</h3>
             <p className="text-sm font-black text-indigo-600 mt-2">الصف {s.grade}</p>
             <div className="mt-10 border-t pt-10 flex justify-between items-center">
                <p className="text-xl font-black text-rose-500">${(s.remaining_balance || 0).toLocaleString()}</p>
                <button onClick={() => navigate('/lessons', { state: { studentToOpen: s } })} className="p-4 bg-slate-900 text-white rounded-full"><ChevronLeft size={24}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Students;