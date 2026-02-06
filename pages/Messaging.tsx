import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Send, Users, CheckCircle, AlertCircle, RefreshCw, 
  Radio, Bell, Zap, Sparkles, X, ShieldCheck, Eye
} from 'lucide-react';

const Messaging = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('تنبيه هام من الإدارة');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, phone').neq('role', 'admin');
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
      const targets = targetType === 'all' ? teachers.map(t => t.id) : selectedTeachers;
      
      const { error } = await supabase.from('broadcast_messages').insert([{
        title,
        body: message,
        targets: targets,
        sender_id: (await supabase.auth.getUser()).data.user?.id
      }]);

      if (error) throw error;

      showFeedback("تم إرسال البث الفوري بنجاح.");
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

      {/* ADMIN HERO BOX */}
      <div className="bg-slate-900 p-12 lg:p-20 rounded-[4.5rem] md:rounded-[5rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-100"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div>
               <div className="flex items-center gap-4 mb-6">
                 <Radio size={32} className="text-amber-400 animate-pulse" />
                 <span className="bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">البث الفوري المركز V4.0</span>
               </div>
               <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter mb-6">مركز التواصل <br/><span className="text-indigo-400">الإداري الشامل</span></h1>
               <p className="text-indigo-100/50 font-black text-xl max-w-xl">تحكم في وصول المعلومات. رسالتك ستظهر كإشعار فوري لجميع المعلمين حتى والموقع مغلق.</p>
            </div>
            <div className="bg-white/5 p-10 rounded-[4rem] border border-white/10 backdrop-blur-xl flex flex-col items-center">
               <span className="text-4xl font-black text-white">{teachers.length}</span>
               <span className="text-[10px] text-indigo-300 font-black mt-2 uppercase tracking-widest">معلم نشط متاح</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
        {/* FORM */}
        <form onSubmit={handleBroadcast} className="lg:col-span-3 bg-white p-14 lg:p-20 rounded-[4.5rem] md:rounded-[6rem] border border-slate-100 shadow-2xl space-y-12">
          <div className="space-y-4">
             <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">عنوان الرسالة الإدارية</label>
             <input required className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] font-black text-xl outline-none focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all shadow-inner" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-4">
             <label className="text-[11px] font-black text-slate-400 mr-8 uppercase tracking-widest">نص التنبيه</label>
             <textarea required placeholder="اكتب ما تريد قوله للمعلمين..." className="w-full p-8 bg-slate-50 border-none rounded-[3rem] md:rounded-[3.5rem] h-60 font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner resize-none" value={message} onChange={e => setMessage(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <button type="button" onClick={() => setTargetType('all')} className={`p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 ${targetType === 'all' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                <Users size={32}/>
                <span className="font-black text-xs md:text-base">بث للكل</span>
             </button>
             <button type="button" onClick={() => setTargetType('selected')} className={`p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-4 transition-all flex flex-col items-center gap-4 ${targetType === 'selected' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                <ShieldCheck size={32}/>
                <span className="font-black text-xs md:text-base">تحديد معلمين</span>
             </button>
          </div>

          <button disabled={sending} className="w-full py-8 bg-indigo-600 text-white font-black rounded-[2.5rem] md:rounded-[3rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 text-2xl group">
             {sending ? <RefreshCw className="animate-spin" /> : <Send size={32} className="group-hover:translate-x-3 transition-transform" />}
             إرسال الآن
          </button>
        </form>
      </div>
    </div>
  );
};

export default Messaging;