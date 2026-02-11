
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  UserPlus, CheckCircle, Send, Book, GraduationCap, MapPin, 
  Video, Layers, Layout, RefreshCw, Star, Clock, AlertCircle, History
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

  if (success) return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-500">
       <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100">
          <CheckCircle size={64} />
       </div>
       <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">تم استلام طلبك بنجاح!</h2>
       <p className="text-slate-400 font-bold text-lg max-w-md">سيقوم المدير العام بمراجعة طلبك والبحث عن أفضل مدرس متاح يطابق جدولك. سنتواصل معك قريباً.</p>
       <button onClick={() => setSuccess(false)} className="mt-12 px-12 py-5 bg-slate-900 text-white rounded-3xl font-black hover:bg-indigo-600 transition-all">إرسال طلب آخر</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
       <div className="bg-slate-900 p-10 md:p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
             <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl rotate-6"><UserPlus size={48} /></div>
             <div className="text-center md:text-right">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">احصل على <span className="text-indigo-400">معلم القمة</span></h1>
                <p className="text-indigo-200 font-bold text-lg">أخبرنا عما تحتاجه وسنقوم بتوصيلك بالمعلم الأمثل.</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* نموذج الطلب */}
          <form onSubmit={handleSubmit} className="bg-white p-10 md:p-12 rounded-[4rem] border shadow-sm space-y-10 animate-in slide-in-from-right-8 h-fit">
             <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><Star className="text-indigo-600" /> تقديم طلب جديد</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">اسم الطالب</label>
                   <div className="relative">
                      <Layout className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50" value={form.student_name} onChange={e => setForm({...form, student_name: e.target.value})} placeholder="الاسم الكامل" />
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">الصف الدراسي</label>
                   <select className="w-full px-8 py-5 bg-slate-50 border-none rounded-[2rem] font-black outline-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                      {[...Array(11)].map((_, i) => <option key={i+1} value={i+1}>الصف {i+1}</option>)}
                      <option value="12">الثاني عشر (توجيهي)</option>
                   </select>
                </div>
                <div className="space-y-4 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">المادة المطلوبة</label>
                   <div className="relative">
                      <Book className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required className="w-full pr-14 pl-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 ring-indigo-50" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="مثلاً: فيزياء وكيمياء" />
                   </div>
                </div>
             </div>

             <div className="space-y-6 p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-3 text-sm"><MapPin size={20} className="text-indigo-600" /> نظام الدراسة المفضل</h4>
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
                {loading ? <RefreshCw className="animate-spin" /> : <Send size={24} />} إرسال الطلب الآن
             </button>
          </form>

          {/* قائمة الطلبات السابقة */}
          <div className="space-y-8 animate-in slide-in-from-left-8">
             <div className="flex items-center justify-between px-4">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><History className="text-indigo-600" /> طلباتي السابقة</h3>
                <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full font-black text-[10px]">{myRequests.length} طلب</span>
             </div>
             
             <div className="space-y-6 overflow-y-auto max-h-[800px] no-scrollbar pr-2">
                {myRequests.length > 0 ? myRequests.map(req => (
                  <div key={req.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${statusColors[req.status]}`}>
                           {statusLabels[req.status]}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 flex items-center gap-2"><Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}</span>
                     </div>
                     <h4 className="text-xl font-black text-slate-900 mb-2">{req.subject}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                        {req.modality === 'home' ? '🏠 حصص منزلية' : '💻 حصص أونلاين'} | {req.type === 'course' ? 'دورة متكاملة' : 'دروس محددة'}
                     </p>
                     
                     {req.status === 'pending' && (
                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                           <AlertCircle className="text-amber-500 shrink-0" size={18} />
                           <p className="text-[10px] font-bold text-slate-400 leading-relaxed">طلبك في مرحلة المطابقة حالياً، سنقوم بالرد عليك خلال 24 ساعة.</p>
                        </div>
                     )}
                     
                     {req.status === 'assigned' && (
                        <div className="bg-emerald-50 p-5 rounded-2xl flex items-center gap-4 border border-emerald-100">
                           <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                           <div>
                              <p className="text-[10px] font-black text-emerald-600 mb-1">تم قبول الطلب بنجاح</p>
                              <p className="text-xs font-bold text-slate-500">سيقوم المعلم المعين بالتواصل معك قريباً لتأكيد الموعد الأول.</p>
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
