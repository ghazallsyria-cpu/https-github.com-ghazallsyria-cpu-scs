
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, ChevronLeft, 
  MapPin, GraduationCap, Phone, 
  Trash2, Edit3, Filter, AlertCircle
} from 'lucide-react';

const Students = ({ isAdmin, profile }: any) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', grade: '12', address: '', academic_year: '2024-2025', semester: '1',
    agreed_amount: '0', is_hourly: false, price_per_hour: '0'
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase.from('student_summary_view').select('*');
    if (!isAdmin) query = query.eq('teacher_id', profile.id);
    const { data } = await query.order('name');
    setStudents(data || []);
    setLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      teacher_id: profile.id,
      agreed_amount: parseFloat(form.agreed_amount),
      price_per_hour: parseFloat(form.price_per_hour),
      phones: [] // Default for now
    };
    const { error } = await supabase.from('students').insert([payload]);
    if (!error) {
      setIsModalOpen(false);
      fetchStudents();
    }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Search & Actions Bar */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">إدارة الطلاب</h2>
            <p className="text-xs font-bold text-slate-400">إجمالي السجلات: {students.length}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن طالب..." 
              className="w-full pr-12 pl-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <Plus size={20} /> <span className="hidden sm:inline">طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-black">جاري جلب القائمة...</div>
        ) : filtered.length > 0 ? filtered.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl border border-slate-100">
                      {s.name[0]}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mt-1">
                         <GraduationCap size={12} /> الصف {s.grade}
                      </div>
                   </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black ${s.is_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                   {s.is_completed ? 'مكتمل' : 'نشط'}
                </div>
             </div>

             <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                   <MapPin size={16} className="text-slate-300" />
                   <span className="font-bold truncate">{s.address || 'العنوان غير محدد'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                   <AlertCircle size={16} className={`${s.remaining_balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                   <span className="font-black">المتبقي: <span className={s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>${s.remaining_balance.toLocaleString()}</span></span>
                </div>
             </div>

             <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                <button className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2">
                   <Edit3 size={14} /> تفاصيل
                </button>
                <button className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                   <Trash2 size={18} />
                </button>
             </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Users size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900">لا يوجد طلاب</h3>
            <p className="text-slate-400 font-bold mt-2">ابدأ بإضافة أول طالب لنظام القمة اليوم.</p>
          </div>
        )}
      </div>

      {/* Modal - Basic Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <form onSubmit={handleAddStudent} className="bg-white w-full max-w-xl p-10 rounded-[3rem] shadow-2xl space-y-6">
              <h3 className="text-2xl font-black mb-6">إضافة طالب جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500 mr-2">اسم الطالب</label>
                  <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none ring-indigo-500 focus:ring-2 font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500 mr-2">الصف الدراسي</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                     <option value="10">الصف العاشر</option>
                     <option value="11">الصف الحادي عشر</option>
                     <option value="12">الصف الثاني عشر</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500 mr-2">المبلغ المتفق عليه</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500 mr-2">العنوان</label>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                 <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">حفظ البيانات</button>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default Students;
