
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
// Added 'Search' to imports
import { Plus, Trash2, CheckCircle, X, AlertCircle, Users, School, MessageCircle, Phone, MapPin, Search } from 'lucide-react';

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
    } catch (e) { showFeedback("خطأ في جلب البيانات", "error"); } finally { setLoading(false); }
  }, [uid, isAdmin, year, semester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validPhones = form.phones.filter(p => p.number.trim() !== '');
      if (validPhones.length === 0) throw new Error("يجب إضافة رقم هاتف واحد على الأقل");

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
      setForm({ name: '', address: '', school_name: '', grade: '12', agreed_amount: '0', is_hourly: false, price_per_hour: '0', phones: [{ number: '', label: 'الطالب' }] });
      fetchStudents();
    } catch (err: any) { showFeedback(err.message, 'error'); }
  };

  const handleAddPhone = () => {
    setForm({ ...form, phones: [...form.phones, { number: '', label: 'الطالب' }] });
  };

  const updatePhone = (index: number, field: string, value: string) => {
    const newPhones = [...form.phones];
    newPhones[index][field] = value;
    setForm({ ...form, phones: newPhones });
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
          <div><h1 className="text-2xl font-black text-slate-900">قائمة الطلاب</h1></div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="ابحث عن طالب..." 
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border rounded-xl text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black shadow-lg flex items-center gap-2 whitespace-nowrap"><Plus size={18}/> إضافة طالب</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.filter(s => s.name.includes(searchTerm)).map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-indigo-500 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="bg-indigo-50 text-indigo-600 px-3 py-0.5 rounded-full text-[10px] font-black">الصف {s.grade}</span>
                   {s.school_name && <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1"><School size={12}/> {s.school_name}</span>}
                 </div>
               </div>
            </div>
            
            <div className="space-y-2 mb-6">
              {s.phones?.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">{p.label}:</span>
                    <span>{p.number}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${p.number.replace(/\s/g, '')}`} 
                    target="_blank" 
                    className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <MessageCircle size={14}/>
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">الرصيد المتبقي</p>
                <p className={`text-lg font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {s.remaining_balance > 0 ? `$${s.remaining_balance}` : 'خالص'}
                </p>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase text-left">نظام المحاسبة</p>
                <p className="text-xs font-black text-slate-600">{s.is_hourly ? 'بالساعة' : 'فصلي'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="bg-white w-full max-w-xl p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] text-right">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 left-8 text-slate-300 hover:text-rose-500"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-8 text-slate-900 flex items-center gap-3"><Plus className="text-indigo-600"/> تسجيل طالب جديد</h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">الاسم الكامل</label>
                  <input required placeholder="مثال: محمد أحمد.." className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">الصف الدراسي</label>
                  <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold appearance-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="10">الصف العاشر (10)</option>
                    <option value="11">الصف الحادي عشر (11)</option>
                    <option value="12">الصف الثاني عشر (12)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">اسم المدرسة (اختياري)</label>
                  <div className="relative">
                    <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input placeholder="مثال: ثانوية جابر.." className="w-full p-4 pl-12 bg-slate-50 border rounded-2xl font-bold" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 mr-2">العنوان / المنطقة</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input placeholder="المنطقة - القطعة.." className="w-full p-4 pl-12 bg-slate-50 border rounded-2xl font-bold" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black text-slate-600 flex items-center gap-2"><Phone size={14}/> أرقام التواصل</label>
                  <button type="button" onClick={handleAddPhone} className="text-indigo-600 font-black text-[10px] hover:underline">+ إضافة رقم آخر</button>
                </div>
                {form.phones.map((p, idx) => (
                  <div key={idx} className="flex gap-2 animate-in slide-in-from-right duration-300">
                    <select className="w-28 p-3 bg-white border rounded-xl font-bold text-xs" value={p.label} onChange={e => updatePhone(idx, 'label', e.target.value)}>
                      <option value="الطالب">الطالب</option>
                      <option value="الأب">الأب</option>
                      <option value="الأم">الأم</option>
                    </select>
                    <input required placeholder="رقم الموبايل" className="flex-1 p-3 bg-white border rounded-xl font-bold text-xs text-left" value={p.number} onChange={e => updatePhone(idx, 'number', e.target.value)} />
                    {idx > 0 && (
                      <button type="button" onClick={() => setForm({...form, phones: form.phones.filter((_, i) => i !== idx)})} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <input type="checkbox" className="w-5 h-5 rounded accent-indigo-600" checked={form.is_hourly} onChange={e => setForm({...form, is_hourly: e.target.checked})} />
                <label className="text-sm font-black text-indigo-700">نظام المحاسبة بالساعة؟</label>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                {form.is_hourly ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2">سعر الساعة الدراسية ($)</label>
                    <input required type="number" className="w-full p-4 bg-white border rounded-2xl font-black text-xl" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2">إجمالي المبلغ الفصلي المتفق عليه ($)</label>
                    <input required type="number" className="w-full p-4 bg-white border rounded-2xl font-black text-xl text-emerald-600" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] mt-8 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">حفظ بيانات الطالب</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Students;
