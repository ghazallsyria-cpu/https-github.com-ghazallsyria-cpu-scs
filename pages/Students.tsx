
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase.ts';
import { Plus, MapPin, Phone, Calendar, Search, Trash2, CheckCircle, X, AlertCircle, Users, GraduationCap, School, MessageCircle } from 'lucide-react';

const Students = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [form, setForm] = useState({ 
    name: '', address: '', school_name: '', grade: '12', 
    agreed_amount: '0', is_hourly: false, price_per_hour: '0',
    phones: [{ number: '', label: 'الطالب' }] as any[]
  });

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      const { data, error } = await query.order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e) { showFeedback("خطأ في الجلب", "error"); } finally { setLoading(false); }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validPhones = form.phones.filter(p => p.number.trim() !== '');
      const { error } = await supabase.from('students').insert([{ 
        name: form.name, address: form.address, school_name: form.school_name, grade: form.grade,
        phones: validPhones,
        agreed_amount: form.is_hourly ? 0 : (parseFloat(form.agreed_amount) || 0),
        is_hourly: form.is_hourly, price_per_hour: form.is_hourly ? (parseFloat(form.price_per_hour) || 0) : 0,
        teacher_id: uid, academic_year: year, semester: semester
      }]);
      if (error) throw error;
      showFeedback('تمت إضافة الطالب بنجاح');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) { showFeedback(err.message, 'error'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-right">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg"><Users size={24} /></div>
          <div><h1 className="text-2xl font-black text-slate-900">إدارة الطلاب</h1></div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl">إضافة طالب جديد</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.filter(s => s.name.includes(searchTerm)).map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-500 transition-all shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">{s.name}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">الصف {s.grade}</span>
              {s.school_name && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1"><School size={10}/> {s.school_name}</span>}
            </div>
            <div className="space-y-2 mb-4">
              {s.phones?.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-xl">
                  <span>{p.label}: {p.number}</span>
                  <a href={`https://wa.me/${p.number.replace(/\s/g, '')}`} target="_blank" className="text-emerald-500 hover:text-emerald-600"><MessageCircle size={16}/></a>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between">
              <span className="text-xs font-black text-slate-400">المتبقي: <span className="text-rose-600">${s.remaining_balance}</span></span>
              <span className="text-xs font-black text-slate-400">{s.is_hourly ? 'نظام ساعة' : 'نظام فصلي'}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-xl p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900">تسجيل طالب جديد</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                  <option value="10">الصف 10</option>
                  <option value="11">الصف 11</option>
                  <option value="12">الصف 12</option>
                </select>
              </div>

              <input placeholder="اسم المدرسة (اختياري)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
              <input placeholder="العنوان السكني" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">أرقام الهواتف</label>
                {form.phones.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select className="w-1/3 p-3 bg-slate-100 border rounded-xl font-bold text-xs" value={p.label} onChange={e => {
                      const newPhones = [...form.phones];
                      newPhones[idx].label = e.target.value;
                      setForm({...form, phones: newPhones});
                    }}>
                      <option value="الطالب">الطالب</option>
                      <option value="الأب">الأب</option>
                      <option value="الأم">الأم</option>
                    </select>
                    <input placeholder="رقم الموبايل" className="flex-1 p-3 bg-slate-100 border rounded-xl font-bold text-xs" value={p.number} onChange={e => {
                      const newPhones = [...form.phones];
                      newPhones[idx].number = e.target.value;
                      setForm({...form, phones: newPhones});
                    }} />
                    {idx > 0 && <button type="button" onClick={() => setForm({...form, phones: form.phones.filter((_, i) => i !== idx)})} className="text-rose-500"><Trash2 size={16}/></button>}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({...form, phones: [...form.phones, {number: '', label: 'الطالب'}]})} className="text-indigo-600 font-bold text-[10px]">+ إضافة رقم آخر</button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl">
                <input type="checkbox" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} />
                <label className="text-sm font-black text-indigo-700">نظام محاسبة بالساعة؟</label>
              </div>

              {form.is_hourly ? (
                <input required type="number" placeholder="سعر الساعة ($)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
              ) : (
                <input required type="number" placeholder="المبلغ الفصلي الإجمالي ($)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
              )}
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl mt-8 shadow-xl">حفظ بيانات الطالب</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
