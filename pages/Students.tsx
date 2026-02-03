
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { StudentStats } from '../types';
import { Plus, Search, MapPin, Phone, BookOpen, Clock } from 'lucide-react';

const Students = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', grade: '', agreed_amount: '' });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    // Adjust queries to respect the user's role
    let qStds = supabase.from('students').select('*');
    let qLsns = supabase.from('lessons').select('*');

    if (role === 'teacher') {
      qStds = qStds.eq('teacher_id', uid);
      qLsns = qLsns.eq('teacher_id', uid);
    }

    const [{ data: stds }, { data: lsns }] = await Promise.all([qStds, qLsns]);
    
    const enriched = (stds || []).map(s => {
      const sLsn = (lsns || []).filter(l => l.student_id === s.id);
      return {
        ...s,
        total_lessons: sLsn.length,
        total_hours: sLsn.reduce((acc, l) => acc + Number(l.hours), 0),
        total_paid: 0,
        remaining_balance: 0
      };
    });
    setStudents(enriched);
    setLoading(false);
  }, [uid, role]); // Added role to dependency array

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('students').insert([{ ...form, agreed_amount: parseFloat(form.agreed_amount), teacher_id: uid }]);
    setIsModalOpen(false);
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">الطلاب</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg">
          <Plus size={20} /> إضافة طالب
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black mb-1">{s.name}</h3>
            <p className="text-indigo-600 font-bold mb-4">{s.grade}</p>
            <div className="space-y-2 text-sm text-slate-500 font-bold">
              <div className="flex items-center gap-2"><MapPin size={14}/> {s.address}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {s.phone}</div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
               <div className="text-xs"><p className="text-slate-400">الحصص</p><p className="font-black">{s.total_lessons}</p></div>
               <div className="text-xs"><p className="text-slate-400">الساعات</p><p className="font-black">{s.total_hours}</p></div>
               <div className="text-xs"><p className="text-slate-400">المبلغ</p><p className="font-black">${s.agreed_amount}</p></div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl">
            <h2 className="text-2xl font-black mb-6">إضافة طالب جديد</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required placeholder="اسم الطالب" className="w-full p-4 border rounded-2xl" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required placeholder="الصف الدراسي" className="w-full p-4 border rounded-2xl" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} />
              <input required type="number" placeholder="المبلغ المتفق عليه" className="w-full p-4 border rounded-2xl" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
              <input placeholder="رقم الهاتف" className="w-full p-4 border rounded-2xl" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <textarea placeholder="العنوان" className="w-full p-4 border rounded-2xl" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg">حفظ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
