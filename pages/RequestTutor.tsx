
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  UserPlus, CheckCircle, Send, Book, GraduationCap, MapPin, 
  Video, Layers, Layout, RefreshCw, Star
} from 'lucide-react';

const RequestTutor = ({ userPhone }: { userPhone: string }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    student_name: '', student_phone: userPhone, grade: '12', 
    subject: '', modality: 'home', type: 'course', notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('tutor_requests').insert([form]);
    if (error) alert(error.message);
    else {
      setSuccess(true);
      setForm({ ...form, subject: '', notes: '' });
    }
    setLoading(false);
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
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
       <div className="bg-slate-900 p-12 md:p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
             <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl rotate-6"><UserPlus size={48} /></div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">احصل على <span className="text-indigo-400">معلم القمة</span></h1>
                <p className="text-indigo-200 font-bold text-lg">أخبرنا عما تحتاجه وسنقوم بتوصيلك بالمعلم الأمثل.</p>
             </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
       </div>

       <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10 animate-in slide-in-from-bottom-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">اسم الطالب</label>
                <div className="relative">
                   <Layout className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input required className="w-full pr-14 pl-6 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold focus:ring-4 ring-indigo-50 transition-all outline-none" value={form.student_name} onChange={e => setForm({...form, student_name: e.target.value})} placeholder="الاسم الكامل" />
                </div>
             </div>
             
             <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">الصف الدراسي</label>
                <div className="relative">
                   <GraduationCap className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <select className="w-full pr-14 pl-6 py-6 bg-slate-50 border-none rounded-[2.5rem] font-black focus:ring-4 ring-indigo-50 outline-none appearance-none" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                      {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>الصف {i+1}</option>)}
                      <option value="12">الثاني عشر (توجيهي)</option>
                   </select>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">المادة المطلوبة</label>
                <div className="relative">
                   <Book className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                   <input required className="w-full pr-14 pl-6 py-6 bg-slate-50 border-none rounded-[2.5rem] font-bold focus:ring-4 ring-indigo-50 transition-all outline-none" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="مثلاً: رياضيات / فيزياء" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">نوع التدريس</label>
                <div className="flex bg-slate-50 p-2 rounded-[2.5rem] gap-2">
                   <button type="button" onClick={() => setForm({...form, type: 'course'})} className={`flex-1 py-4 rounded-[1.8rem] font-black text-xs transition-all ${form.type === 'course' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>كورس كامل</button>
                   <button type="button" onClick={() => setForm({...form, type: 'single'})} className={`flex-1 py-4 rounded-[1.8rem] font-black text-xs transition-all ${form.type === 'single' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>حصص فردية</button>
                </div>
             </div>
          </div>

          <div className="space-y-6 p-10 bg-indigo-50 rounded-[3.5rem] border border-indigo-100">
             <h4 className="font-black text-indigo-600 flex items-center gap-4 text-xl"><MapPin /> أين ترغب بالدراسة؟</h4>
             <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={() => setForm({...form, modality: 'home'})} className={`p-10 rounded-[2.5rem] flex flex-col items-center gap-4 border-4 transition-all ${form.modality === 'home' ? 'bg-white border-indigo-600 shadow-2xl scale-105' : 'bg-transparent border-transparent text-slate-400'}`}>
                   <Layers size={48} />
                   <span className="font-black">تعليم في البيت</span>
                </button>
                <button type="button" onClick={() => setForm({...form, modality: 'online'})} className={`p-10 rounded-[2.5rem] flex flex-col items-center gap-4 border-4 transition-all ${form.modality === 'online' ? 'bg-white border-indigo-600 shadow-2xl scale-105' : 'bg-transparent border-transparent text-slate-400'}`}>
                   <Video size={48} />
                   <span className="font-black">عن بعد (Zoom/Online)</span>
                </button>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-4">ملاحظات إضافية (اختياري)</label>
             <textarea className="w-full p-8 bg-slate-50 border-none rounded-[3rem] font-bold min-h-[150px] focus:ring-4 ring-indigo-50 outline-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="أي تفاصيل أخرى تود إخبارنا بها..." />
          </div>

          <button disabled={loading} className="w-full py-8 bg-slate-900 text-white rounded-[3.5rem] font-black text-2xl shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95">
             {loading ? <RefreshCw className="animate-spin" /> : <Send size={32} />} إرسال الطلب لغرفة التحكم
          </button>
       </form>
    </div>
  );
};

export default RequestTutor;
