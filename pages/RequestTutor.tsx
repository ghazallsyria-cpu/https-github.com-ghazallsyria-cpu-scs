
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  UserPlus, CheckCircle, Send, Book, GraduationCap, MapPin, 
  Video, Layers, Layout, RefreshCw, Star, Clock, AlertCircle, History, Phone
} from 'lucide-react';

const RequestTutor = ({ userPhone }: { userPhone: string }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [form, setForm] = useState({
    student_name: '', student_phone: userPhone, grade: '12', 
    subject: '', modality: 'home', type: 'course', notes: ''
  });

  const fetchMyRequests = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tutor_requests')
        .select('*')
        .eq('student_phone', userPhone)
        .order('created_at', { ascending: false });
      setMyRequests(data || []);
    } catch (err) { console.error(err); }
  }, [userPhone]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('tutor_requests').insert([form]);
    if (error) alert("فشل الإرسال: " + error.message);
    else {
      setSuccess(true);
      fetchMyRequests();
      setForm({ ...form, subject: '', notes: '' });
      setTimeout(() => setSuccess(false), 5000);
    }
    setLoading(false);
  };

  const statusColors: any = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    assigned: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const statusLabels: any = {
    pending: 'قيد المراجعة',
    assigned: 'تم تعيين معلم',
    rejected: 'مرفوض / غير متاح'
  };

  const gradeOptions = [...Array(12)].map((_, i) => ({ value: `${i + 1}`, label: `الصف ${i + 1}` }));

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 text-right" dir="rtl">
       <div className="bg-slate-900 p-10 md:p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
             <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl rotate-6"><UserPlus size={48} /></div>
             <div className="text-center md:text-right">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">بوابة <span className="text-indigo-400">طلب معلم</span></h1>
                <p className="text-indigo-200 font-bold text-lg">سجل المادة التي تريدها وسنبحث لك عن أفضل خيارات القمة.</p>
             </div>
          </div>
       </div>

       {success && (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4 text-emerald-600 font-black animate-in slide-in-from-top-4">
             <CheckCircle /> تم إرسال طلبك بنجاح! سنقوم بالتواصل معك قريباً.
          </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* نموذج الطلب الجديد */}
          <form onSubmit={handleSubmit} className="bg-white p-10 md:p-12 rounded-[4rem] border shadow-sm space-y-10 animate-in slide-in-from-right-8 h-fit">
             <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><Star className="text-indigo-600" /> تقديم طلب جديد</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">اسم الطالب الكامل</label>
                   <input required className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50" value={form.student_name} onChange={e => setForm({...form, student_name: e.target.value})} placeholder="الاسم كما هو في الهوية" />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">الصف الدراسي</label>
                   <select className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                      {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      <option value="12">الصف الثاني عشر (توجيهي)</option>
                   </select>
                </div>
                <div className="space-y-4 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">المادة الدراسية المطلوبة</label>
                   <div className="relative">
                      <Book className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="مثلاً: رياضيات، لغة إنجليزية، فيزياء..." />
                   </div>
                </div>
                <div className="space-y-4 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">رقم الموبايل للتواصل</label>
                   <div className="relative">
                      <Phone className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50 text-left" value={form.student_phone} onChange={e => setForm({...form, student_phone: e.target.value})} placeholder="00000000" />
                   </div>
                </div>
             </div>

             <div className="space-y-6 p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-3 text-sm"><MapPin size={20} className="text-indigo-600" /> نظام التدريس المفضل</h4>
                <div className="grid grid-cols-2 gap-4">
                   <button type="button" onClick={() => setForm({...form, modality: 'home'})} className={`py-6 rounded-3xl flex flex-col items-center gap-3 border-4 transition-all ${form.modality === 'home' ? 'bg-white border-indigo-600 shadow-xl' : 'bg-transparent border-transparent text-slate-400'}`}>
                      <Layers size={24} />
                      <span className="font-black text-[10px]">تعليم في البيت</span>
                   </button>
                   <button type="button" onClick={() => setForm({...form, modality: 'online'})} className={`py-6 rounded-3xl flex flex-col items-center gap-3 border-4 transition-all ${form.modality === 'online' ? 'bg-white border-indigo-600 shadow-xl' : 'bg-transparent border-transparent text-slate-400'}`}>
                      <Video size={24} />
                      <span className="font-black text-[10px]">عن بعد (Online)</span>
                   </button>
                </div>
             </div>

             <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
                {loading ? <RefreshCw className="animate-spin" /> : <Send size={24} />} إرسال الطلب للبحث
             </button>
          </form>

          {/* لوحة متابعة الطلبات الخاصة بالطالب */}
          <div className="space-y-8 animate-in slide-in-from-left-8">
             <div className="flex items-center justify-between px-4">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><History className="text-indigo-600" /> متابعة طلباتي</h3>
                <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full font-black text-[10px]">{myRequests.length} طلب نشط</span>
             </div>
             
             <div className="space-y-6 overflow-y-auto max-h-[800px] no-scrollbar pr-2">
                {myRequests.length > 0 ? myRequests.map(req => (
                  <div key={req.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${statusColors[req.status]}`}>
                           {statusLabels[req.status]}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 flex items-center gap-2"><Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}</span>
                     </div>
                     <h4 className="text-xl font-black text-slate-900 mb-2">مادة: {req.subject}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                        الصف {req.grade} | {req.modality === 'home' ? '🏠 حصص منزلية' : '💻 حصص أونلاين'}
                     </p>
                     
                     {req.status === 'pending' && (
                        <div className="bg-amber-50 p-4 rounded-2xl flex items-center gap-4 border border-amber-100">
                           <AlertCircle className="text-amber-500 shrink-0" size={18} />
                           <p className="text-[10px] font-bold text-slate-400 leading-relaxed">طلبك في مرحلة البحث عن أفضل معلم متاح حالياً.</p>
                        </div>
                     )}
                     
                     {req.status === 'assigned' && (
                        <div className="bg-emerald-50 p-5 rounded-2xl flex items-center gap-4 border border-emerald-100">
                           <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                           <div>
                              <p className="text-[10px] font-black text-emerald-600 mb-1">تمت المطابقة بنجاح</p>
                              <p className="text-xs font-bold text-slate-500">سيقوم المعلم بالتواصل مع رقم موبايلك ({req.student_phone}) قريباً.</p>
                           </div>
                        </div>
                     )}
                  </div>
                )) : (
                  <div className="py-20 bg-white rounded-[3rem] border border-slate-100 text-center space-y-4">
                     <Clock size={48} className="mx-auto text-slate-100" />
                     <p className="text-slate-400 font-black text-sm">لم تقم بإرسال أي طلبات بعد.</p>
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default RequestTutor;
