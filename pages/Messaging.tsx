
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Send, Users, CheckCircle, AlertCircle, RefreshCw, 
  MessageSquare, Bell, Zap, Sparkles, X, ShieldCheck
} from 'lucide-react';

const Messaging = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('تنبيه إداري من المنصة');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
      setTeachers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleToggleTeacher = (id: string) => {
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setSending(true);

    try {
      // 1. تسجيل الرسالة في جدول البث (Broadcasts)
      const targets = targetType === 'all' ? teachers.map(t => t.id) : selectedTeachers;
      
      const { error } = await supabase.from('broadcast_messages').insert([{
        title,
        body: message,
        targets: targets,
        sender_id: (await supabase.auth.getUser()).data.user?.id
      }]);

      if (error) throw error;

      showFeedback("تم إرسال البث بنجاح إلى المعلمين المستهدفين.");
      setMessage('');
      setSelectedTeachers([]);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-32 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 font-black transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />} 
          <span className="text-lg">{feedback.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-slate-900 p-12 lg:p-20 rounded-[5rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-5 mb-10">
              <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <Zap size={20} className="text-amber-400" /> البث الفوري المركزي
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter mb-6">إرسال تنبيهات <br/><span className="text-indigo-400">لجميع المعلمين</span></h1>
            <p className="text-indigo-100/60 font-black max-w-2xl text-xl leading-relaxed">رسالتك ستصل كإشعار فوري على هواتف وحواسيب المعلمين حتى وإن كانت المنصة مغلقة.</p>
         </div>
         <Send className="absolute -bottom-20 -left-20 text-white/[0.03] w-[600px] h-[600px] -rotate-12 group-hover:rotate-0 transition-transform duration-[3s]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* COMPOSITION FORM */}
        <form onSubmit={handleBroadcast} className="bg-white p-14 lg:p-20 rounded-[6rem] border border-slate-100 shadow-2xl space-y-10">
          <div className="space-y-4">
             <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">عنوان التنبيه</label>
             <input required className="w-full p-6 bg-slate-50 border-none rounded-[2.2rem] font-black text-lg outline-none focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all shadow-inner" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-4">
             <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">محتوى الرسالة</label>
             <textarea required placeholder="اكتب رسالتك هنا..." className="w-full p-8 bg-slate-50 border-none rounded-[3rem] h-60 font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner resize-none" value={message} onChange={e => setMessage(e.target.value)} />
          </div>

          <div className="space-y-6">
             <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">تحديد المستهدفين</label>
             <div className="grid grid-cols-2 gap-5">
                <button type="button" onClick={() => setTargetType('all')} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${targetType === 'all' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                   <Users size={32}/>
                   <span className="font-black">كافة المعلمين</span>
                </button>
                <button type="button" onClick={() => setTargetType('selected')} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${targetType === 'selected' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                   <ShieldCheck size={32}/>
                   <span className="font-black">اختيار معلمين</span>
                </button>
             </div>
          </div>

          <button disabled={sending} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[3rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-6 active:scale-95 text-2xl group">
             {sending ? <RefreshCw className="animate-spin" /> : <Send size={32} className="group-hover:translate-x-3 transition-transform" />}
             إطلاق البث الفوري
          </button>
        </form>

        {/* TEACHER SELECTOR (Conditional) */}
        <div className={`bg-white p-14 lg:p-16 rounded-[6rem] border border-slate-100 shadow-2xl transition-all duration-700 ${targetType === 'selected' ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-10'}`}>
           <h3 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4"><Users size={32} className="text-indigo-600"/> قائمة المعلمين المعتمدين</h3>
           <div className="space-y-4 h-[700px] overflow-y-auto no-scrollbar pr-4">
              {teachers.map(t => (
                <button key={t.id} onClick={() => handleToggleTeacher(t.id)} className={`w-full p-8 rounded-[2.5rem] border-2 text-right transition-all flex items-center justify-between group ${selectedTeachers.includes(t.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-50 text-slate-700 hover:border-indigo-200'}`}>
                   <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${selectedTeachers.includes(t.id) ? 'bg-white/20' : 'bg-white text-indigo-600'}`}>
                        {t.full_name[0]}
                      </div>
                      <span className="text-xl font-black">{t.full_name}</span>
                   </div>
                   {selectedTeachers.includes(t.id) && <CheckCircle size={24} className="text-white" />}
                </button>
              ))}
              {teachers.length === 0 && <p className="text-center py-20 opacity-30 italic font-black">لا يوجد معلمين مسجلين حالياً</p>}
           </div>
           
           <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between items-center">
              <span className="text-sm font-black text-slate-400">تم اختيار: {selectedTeachers.length} معلم</span>
              <button onClick={() => setSelectedTeachers([])} className="text-rose-500 font-black text-xs hover:underline">إلغاء الكل</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Messaging;
