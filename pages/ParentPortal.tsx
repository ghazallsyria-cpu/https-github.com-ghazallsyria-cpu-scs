
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  School, Wallet, BookOpen, Calendar, Clock, MessageCircle, AlertCircle, 
  CheckCircle, RefreshCw, Send, Sparkles, User, Briefcase, ChevronLeft, LayoutGrid
} from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [loading, setLoading] = useState(true);
  const [availableRecords, setAvailableRecords] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(localStorage.getItem('lastSelectedStudent'));
  const [student, setStudent] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [note, setNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAvailableRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data: stds, error } = await supabase.rpc('get_student_by_parent_phone', { phone_val: parentPhone });
      if (error) throw error;
      setAvailableRecords(stds || []);
      if (stds?.length === 1) {
        setSelectedStudentId(stds[0].id);
      }
    } catch (e: any) {
      showFeedback("خطأ في الاتصال: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [parentPhone]);

  const fetchRecordDetails = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const active = availableRecords.find(r => r.id === sid);
      if (!active) {
        const { data: stds } = await supabase.rpc('get_student_by_parent_phone', { phone_val: parentPhone });
        const retryActive = stds?.find((r:any) => r.id === sid);
        if (retryActive) setStudent(retryActive);
      } else {
        setStudent(active);
      }

      const [lsns, sched] = await Promise.all([
        supabase.from('lessons').select('*').eq('student_id', sid).order('lesson_date', { ascending: false }).limit(10),
        supabase.from('schedules').select('*').eq('student_id', sid).order('start_time')
      ]);

      setLessons(lsns.data || []);
      setSchedule(sched.data || []);
      localStorage.setItem('lastSelectedStudent', sid);
    } catch (e) {
      showFeedback("فشل تحميل تفاصيل السجل", "error");
    } finally {
      setLoading(false);
    }
  }, [availableRecords, parentPhone]);

  useEffect(() => { fetchAvailableRecords(); }, [fetchAvailableRecords]);

  useEffect(() => {
    if (selectedStudentId && availableRecords.length > 0) {
      fetchRecordDetails(selectedStudentId);
    }
  }, [selectedStudentId, availableRecords, fetchRecordDetails]);

  const handleSendRequest = async (type: string, content: string, amount?: number) => {
    if (!student) return;
    setSendingRequest(true);
    try {
      const { error } = await supabase.from('parent_requests').insert([{
        student_id: student.id,
        parent_phone: parentPhone,
        type,
        content,
        amount: amount || null,
        status: 'pending'
      }]);
      if (error) throw error;
      showFeedback("تم إرسال طلبك بنجاح للأستاذ " + student.teacher_name);
      if (type === 'note') setNote('');
    } catch (err: any) { showFeedback(err.message, "error"); }
    finally { setSendingRequest(false); }
  };

  const handleApologize = (day: string) => {
    if (!confirm(`هل أنت متأكد من الاعتذار عن حصة يوم ${day}؟`)) return;
    handleSendRequest('apology', `اعتذار عن حصة يوم ${day}`);
  };

  if (loading && availableRecords.length === 0) return (
    <div className="h-96 flex items-center justify-center"><RefreshCw className="animate-spin text-emerald-600" size={40} /></div>
  );

  if (!selectedStudentId || (availableRecords.length > 1 && !student)) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700 text-right">
        <div className="text-center mb-16">
           <div className="bg-emerald-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl mb-8">
              <School size={48} />
           </div>
           <h1 className="text-4xl font-black text-slate-900 mb-4">أهلاً بك في منصة القمة</h1>
           <p className="text-slate-500 font-bold text-lg">يرجى اختيار المدرس أو الطالب الذي ترغب في متابعته الآن:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {availableRecords.map((record) => (
             <button 
               key={record.id} 
               onClick={() => setSelectedStudentId(record.id)}
               className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-50 hover:border-emerald-500 hover:shadow-2xl transition-all text-right group flex flex-col items-start relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-3 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all"></div>
                <div className="flex items-center gap-6 mb-8">
                   <div className="bg-slate-100 p-5 rounded-3xl text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <User size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">{record.name}</h3>
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-1">الصف {record.grade}</p>
                   </div>
                </div>
                
                <div className="w-full bg-slate-50/50 p-6 rounded-[2rem] space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-400">الأستاذ المتابع:</span>
                      <span className="text-sm font-black text-indigo-600 flex items-center gap-2"><Briefcase size={14}/> {record.teacher_name}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-400">الحالة المالية:</span>
                      <span className={`text-sm font-black ${record.remaining_balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {record.remaining_balance > 0 ? `متبقي $${record.remaining_balance}` : 'خالص'}
                      </span>
                   </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-emerald-600 font-black text-xs group-hover:-translate-x-2 transition-transform self-end">
                   دخول لوحة المتابعة <ChevronLeft size={16} />
                </div>
             </button>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-['Cairo'] text-right">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 font-black bg-emerald-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex gap-4">
            {availableRecords.length > 1 && (
              <button 
                onClick={() => { setSelectedStudentId(null); setStudent(null); }}
                className="bg-white text-emerald-600 px-8 py-4 rounded-[1.8rem] font-black border border-emerald-50 text-xs shadow-xl flex items-center gap-3 hover:bg-emerald-50 transition-all"
              >
                <LayoutGrid size={18} /> تبديل المدرس/الطالب
              </button>
            )}
         </div>
         <div className="bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">متابعة مباشرة - {student?.teacher_name}</span>
         </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] text-white shadow-2xl relative overflow-hidden group border border-emerald-500/20">
         <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="text-center lg:text-right">
               <span className="bg-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6 w-fit mx-auto lg:mx-0">
                 <Sparkles size={14} className="text-amber-300" /> بوابة المتابعة التعليمية
               </span>
               <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 tracking-tighter">متابعة الطالب <br/><span className="text-emerald-300">{student?.name}</span></h1>
               <p className="text-emerald-100/70 font-bold text-lg">مع الأستاذ {student?.teacher_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
               <div className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/20 text-center shadow-xl">
                  <p className="text-[9px] text-emerald-200 font-black uppercase mb-2">الحصص المنجزة</p>
                  <p className="text-3xl md:text-5xl font-black">{student?.total_lessons || 0}</p>
               </div>
               <div className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/20 text-center shadow-xl">
                  <p className="text-[9px] text-emerald-200 font-black uppercase mb-2">إجمالي المدفوع</p>
                  <p className="text-3xl md:text-5xl font-black">${student?.total_paid || 0}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex items-center justify-between group">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">المتبقي المالي للأستاذ {student?.teacher_name}</p>
                 <h4 className="text-4xl font-black text-rose-500 tracking-tighter">${student?.remaining_balance?.toLocaleString()}</h4>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-500 group-hover:scale-110 transition-transform"><Wallet size={36}/></div>
           </div>

           <div className="bg-white p-8 md:p-14 rounded-[4rem] shadow-2xl border border-slate-50">
              <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4"><BookOpen size={28} className="text-emerald-600"/> آخر الحصص المسجلة</h3>
              <div className="space-y-6">
                 {lessons.map(l => (
                   <div key={l.id} className="p-8 bg-slate-50/50 rounded-[2.5rem] flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-emerald-100">
                      <div className="flex items-center gap-6">
                         <div className="bg-white p-4 rounded-2xl shadow-sm text-emerald-600 font-black text-center min-w-[70px] border border-slate-100">
                            <span className="text-[10px] block opacity-50 uppercase tracking-widest">{new Date(l.lesson_date).toLocaleDateString('ar-EG', {month: 'short'})}</span>
                            <span className="text-2xl">{new Date(l.lesson_date).getDate()}</span>
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-lg">حصة تعليمية ({l.hours}س)</p>
                            <p className="text-xs text-slate-400 font-bold mt-1 leading-relaxed">"{l.notes || 'لا يوجد ملاحظات مسجلة'}"</p>
                         </div>
                      </div>
                   </div>
                 ))}
                 {lessons.length === 0 && <div className="text-center py-10 opacity-30 italic">لا توجد حصص مسجلة بعد</div>}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Calendar size={22} className="text-emerald-400"/> الجدول مع المدرس</h3>
              <div className="space-y-4">
                 {schedule.map(s => (
                   <div key={s.id} className="bg-white/5 border border-white/10 p-5 rounded-[1.8rem] flex justify-between items-center hover:bg-white/10 transition-all">
                      <div>
                         <p className="font-black text-sm">{s.day_of_week}</p>
                         <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-widest">{s.start_time} - {s.duration_hours}س</p>
                      </div>
                      <button onClick={() => handleApologize(s.day_of_week)} className="text-[10px] bg-rose-500/20 text-rose-400 px-5 py-2 rounded-full font-black hover:bg-rose-500 hover:text-white transition-all">اعتذار</button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><MessageCircle size={22} className="text-emerald-600"/> رسالة للأستاذ</h3>
              <textarea placeholder="اكتب ملاحظاتك هنا..." className="w-full p-6 bg-slate-50 rounded-[2rem] h-32 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all" value={note} onChange={e => setNote(e.target.value)} />
              <button onClick={() => handleSendRequest('note', note)} disabled={sendingRequest} className="w-full py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-lg mt-4 flex items-center justify-center gap-3 active:scale-95">
                 {sendingRequest ? <RefreshCw className="animate-spin" /> : <Send size={18}/>} إرسال
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
