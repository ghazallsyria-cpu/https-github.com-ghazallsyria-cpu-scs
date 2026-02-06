
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Plus, Search, MapPin, 
  GraduationCap, Trash2, Edit3, 
  AlertCircle, ChevronRight, Filter, 
  CheckCircle2, X, Clock
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
      phones: []
    };
    const { error } = await supabase.from('students').insert([payload]);
    if (!error) {
      setIsModalOpen(false);
      fetchStudents();
    }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Dynamic Header */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 overflow-hidden relative group">
        <div className="flex items-center gap-6 z-10">
          <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">إدارة <span className="text-indigo-600">الطلاب</span></h2>
            <p className="text-slate-400 font-bold mt-1">لديك الآن {students.length} طلاب مسجلين في النظام.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto z-10">
          <div className="relative flex-1 md:w-96 group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الصف..." 
              className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-4 ring-indigo-500/10 font-bold transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl active:scale-[0.98]">
            <Plus size={22} /> <span className="hidden sm:inline text-lg">إضافة طالب</span>
          </button>
        </div>

        {/* Abstract shape */}
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-indigo-50/50 blur-[80px] rounded-full"></div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-32 text-center">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="font-black text-slate-400">جاري تحميل السجلات...</p>
          </div>
        ) : filtered.length > 0 ? filtered.map(s => (
          <div key={s.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
             
             {/* Completion Badge */}
             <div className={`absolute top-8 left-8 p-3 rounded-2xl ${s.is_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                {/* Fixed: Use Clock component imported from lucide-react */}
                {s.is_completed ? <CheckCircle2 size={24} /> : <Clock size={24} />}
             </div>

             <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 font-black text-4xl border-2 border-white shadow-inner mb-6 group-hover:scale-110 transition-transform">
                   {s.name[0]}
                </div>
                <h4 className="font-black text-slate-900 text-2xl group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase mt-2 tracking-widest">
                   <GraduationCap size={14} className="text-indigo-400" /> الصف {s.grade}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-50 p-5 rounded-3xl">
                   <span className="text-[10px] font-black text-slate-400 block mb-1">المتبقي</span>
                   <span className={`text-xl font-black ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${s.remaining_balance.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl">
                   <span className="text-[10px] font-black text-slate-400 block mb-1">الحصص</span>
                   <span className="text-xl font-black text-slate-900">{s.total_lessons} حصة</span>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <button className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                   تفاصيل الملف <ChevronRight size={18} />
                </button>
                <button className="p-5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[2rem] transition-all">
                   <Trash2 size={22} />
                </button>
             </div>
          </div>
        )) : (
          <div className="col-span-full bg-white p-24 rounded-[5rem] text-center border-2 border-dashed border-slate-100">
            <div className="bg-indigo-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-indigo-600">
              <Users size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900">القائمة فارغة تماماً</h3>
            <p className="text-slate-400 font-bold mt-4 text-xl">ابدأ بإضافة أول طالب لنظام القمة اليوم وابدأ رحلة التميز.</p>
          </div>
        )}
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
           <form onSubmit={handleAddStudent} className="bg-white w-full max-w-2xl p-12 rounded-[4rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] space-y-8 relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-3xl font-black text-slate-900">إضافة <span className="text-indigo-600">عضو جديد</span></h3>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-full transition-colors"><X size={28} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 mr-2">الاسم الكامل</label>
                  <input required className="w-full p-5 bg-slate-50 rounded-3xl outline-none focus:ring-4 ring-indigo-500/10 font-bold transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 mr-2">الصف</label>
                  <select className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                     <option value="10">الصف العاشر</option>
                     <option value="11">الصف الحادي عشر</option>
                     <option value="12">الصف الثاني عشر</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 mr-2">المبلغ الكلي المتفق عليه</label>
                  <input type="number" className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" value={form.agreed_amount} onChange={e => setForm({...form, agreed_amount: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-700 mr-2">منطقة السكن</label>
                  <input className="w-full p-5 bg-slate-50 rounded-3xl outline-none font-bold" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-6 pt-10">
                 <button type="submit" className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl hover:bg-slate-800 transition-all text-xl">حفظ البيانات</button>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-6 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default Students;
