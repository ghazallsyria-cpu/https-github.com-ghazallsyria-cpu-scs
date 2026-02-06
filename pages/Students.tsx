
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, 
  GraduationCap, Trash2, Edit3, 
  ChevronRight, X, Clock, Copy, 
  Phone, Smartphone
} from 'lucide-react';

const Students = ({ isAdmin, profile }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', grade: '12', address: '', academic_year: '2024-2025', semester: '1',
    agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{number: '', label: 'الطالب'}]
  });

  const [transferForm, setTransferForm] = useState({ year: '2025-2026', semester: '1', studentId: '' });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase.from('student_summary_view').select('*');
    if (!isAdmin) query = query.eq('teacher_id', profile.id);
    const { data } = await query.order('name');
    setStudents(data || []);
    setLoading(false);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      teacher_id: profile.id,
      agreed_amount: parseFloat(form.agreed_amount),
      price_per_hour: parseFloat(form.price_per_hour)
    };

    if (editingStudent) {
      await supabase.from('students').update(payload).eq('id', editingStudent.id);
    } else {
      await supabase.from('students').insert([payload]);
    }
    
    setIsModalOpen(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handleTransfer = async () => {
    const student = students.find(s => s.id === transferForm.studentId);
    if (!student) return;
    
    const { error } = await supabase.from('students').insert([{
      ...student,
      id: undefined, // Let DB generate new ID
      academic_year: transferForm.year,
      semester: transferForm.semester,
      created_at: undefined,
      total_lessons: undefined,
      total_paid: undefined,
      remaining_balance: undefined
    }]);

    if (!error) {
      setIsTransferModalOpen(false);
      alert("تم نسخ الطالب للفصل الجديد بنجاح.");
      fetchStudents();
    }
  };

  const openEdit = (s: any) => {
    setEditingStudent(s);
    setForm({
      name: s.name, grade: s.grade, address: s.address, academic_year: s.academic_year,
      semester: s.semester, agreed_amount: s.agreed_amount.toString(),
      is_hourly: s.is_hourly, price_per_hour: s.price_per_hour.toString(),
      phones: s.phones || [{number: '', label: 'الطالب'}]
    });
    setIsModalOpen(true);
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10">
      <div className="bg-white p-12 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white"><Users size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">إدارة <span className="text-indigo-600">الطلاب</span></h2>
            <p className="text-slate-400 font-bold">المعلم: {profile?.full_name} | المادة: {profile?.subjects}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input placeholder="بحث بالاسم..." className="w-full md:w-64 p-5 bg-slate-50 border-none rounded-[2rem] font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={() => { setEditingStudent(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3">
            <Plus size={22} /> إضافة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(s => (
          <div key={s.id} className="bg-white p-10 rounded-[4rem] border shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
             <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 font-black text-4xl mb-6">{s.name[0]}</div>
                <h4 className="font-black text-slate-900 text-2xl group-hover:text-indigo-600">{s.name}</h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase mt-2">
                   <GraduationCap size={14} /> الصف {s.grade} | {s.semester === '1' ? 'كورس أول' : 'كورس ثان'}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-50 p-5 rounded-3xl">
                   <span className="text-[10px] font-black text-slate-400 block mb-1">المتبقي</span>
                   <span className={`text-xl font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl">
                   <span className="text-[10px] font-black text-slate-400 block mb-1">الدروس</span>
                   <span className="text-xl font-black text-slate-900">{s.total_lessons} حصة</span>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <button onClick={() => openEdit(s)} className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-2"><Edit3 size={18} /> تعديل</button>
                <button onClick={() => { setTransferForm({...transferForm, studentId: s.id}); setIsTransferModalOpen(true); }} className="p-5 bg-blue-50 text-blue-600 rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all"><Copy size={22} /></button>
                <button className="p-5 bg-rose-50 text-rose-500 rounded-[2rem] hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={22} /></button>
             </div>
          </div>
        ))}
      </div>

      {/* Modal إضافة/تعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <form onSubmit={handleSaveStudent} className="bg-white w-full max-w-2xl p-12 rounded-[4rem] space-y-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-3xl font-black">{editingStudent ? 'تعديل بيانات' : 'إضافة طالب'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">الاسم</label>
                   <input required className="w-full p-5 bg-slate-50 rounded-3xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">الصف</label>
                   <select className="w-full p-5 bg-slate-50 rounded-3xl font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                     <option value="10">العاشر</option><option value="11">الحادي عشر</option><option value="12">الثاني عشر</option>
                   </select>
                </div>
                {form.phones.map((ph, idx) => (
                  <div key={idx} className="space-y-2 md:col-span-2 flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-black text-slate-700">رقم الهاتف ({ph.label})</label>
                      <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold" value={ph.number} onChange={e => {
                        const newPh = [...form.phones]; newPh[idx].number = e.target.value; setForm({...form, phones: newPh});
                      }} />
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                   <label className="text-sm font-black text-slate-700">المبلغ المتفق عليه</label>
                   <input type="number" className="w-full p-5 bg-slate-50 rounded-3xl font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-6">
                 <button type="submit" className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black">حفظ التغييرات</button>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-6 bg-slate-100 rounded-[2.5rem] font-black">إلغاء</button>
              </div>
           </form>
        </div>
      )}

      {/* Modal النقل */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-10 rounded-[3rem] space-y-8">
              <h3 className="text-2xl font-black">نسخ الطالب لفصل جديد</h3>
              <div className="space-y-4">
                 <div><label className="text-sm font-black">السنة الدراسية</label><input className="w-full p-4 bg-slate-50 rounded-2xl" value={transferForm.year} onChange={e => setTransferForm({...transferForm, year: e.target.value})} /></div>
                 <div><label className="text-sm font-black">الكورس</label>
                   <select className="w-full p-4 bg-slate-50 rounded-2xl" value={transferForm.semester} onChange={e => setTransferForm({...transferForm, semester: e.target.value})}>
                     <option value="1">الكورس الأول</option><option value="2">الكورس الثاني</option>
                   </select>
                 </div>
              </div>
              <button onClick={handleTransfer} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black">إتمام النسخ</button>
              <button onClick={() => setIsTransferModalOpen(false)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black">إلغاء</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Students;
