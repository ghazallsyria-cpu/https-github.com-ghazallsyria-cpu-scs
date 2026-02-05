
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Heart, Wallet, BookOpen, Calendar, Clock, MessageCircle, AlertCircle, 
  CheckCircle, RefreshCw, Send, DollarSign, Sparkles, User, Star, TrendingUp, X, GraduationCap, ChevronLeft, Briefcase
} from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [loading, setLoading] = useState(true);
  const [availableRecords, setAvailableRecords] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [note, setNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: stds, error: stdError } = await supabase.rpc('get_student_by_parent_phone', { phone_val: parentPhone });
      if (stdError) throw stdError;
      
      if (!stds || stds.length === 0) {
        setLoading(false);
        return;
      }

      setAvailableRecords(stds);

      // إذا كان هناك سجل واحد فقط، نختاره تلقائياً
      if (stds.length === 1) {
        setSelectedStudentId(stds[0].id);
      }
    } catch (e: any) { 
      console.error(e);
      showFeedback("خطأ في جلب البيانات: " + e.message, "error");
    } finally { setLoading(false); }
  }, [parentPhone]);

  const fetchStudentFullDetails = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const activeStudent = availableRecords.find(r => r.id === sid);
      if (!activeStudent) return;
      
      setStudent(activeStudent);

      const [lsns, pays, sched] = await Promise.all([
        supabase.from('lessons').select('*').eq('student_id', sid).order('lesson_date', { ascending: false }),
        supabase.from('payments').select('*').eq('student_id', sid).order('payment_date', { ascending: false }),
        supabase.from('schedules').select('*').eq('student_id', sid).order('start_time')
      ]);

      setLessons(lsns.data || []);
      setPayments(pays.data || []);
      setSchedule(sched.data || []);
    } catch (e) {
      showFeedback("فشل تحميل تفاصيل السجل", "error");
    } finally { setLoading(false); }
  }, [availableRecords]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentFullDetails(selectedStudentId);
    }
  }, [selectedStudentId, fetchStudentFullDetails]);

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
      showFeedback("تم إرسال طلبك بنجاح وسيقوم الأستاذ بمراجعته");
      if (type === 'note') setNote('');
      if (type === 'payment_intent') {
         setShowPaymentModal(false);
         setPaymentAmount('');
      }
    } catch (err: any) { showFeedback(err.message, "error"); }
    finally { setSendingRequest(false); }
  };

  const handleApologize = async (day: string) => {
    if (!confirm(`هل ترغب بالاعتذار عن حصة يوم ${day}؟ سيتم إبلاغ الأستاذ رسمياً.`)) return;
    handleSendRequest('apology', `اعتذار رسمي عن موعد يوم ${day}`);
  };

  if (loading && availableRecords.length === 0) return (
    <div className="h-96 flex items-center justify-center"><RefreshCw className="animate-spin text-emerald-600" size={40} /></div>
  );

  // واجهة الاختيار في حال وجود أكثر من سجل
  if (!selectedStudentId && availableRecords.length > 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-10 animate-in fade-in duration-700">
        <div className="text-center space-y-4">
          <div className="bg-emerald-100 text-emerald-600 p-6 rounded-[2.5rem] inline-block shadow-xl">
             <GraduationCap size={48} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900">مرحباً بك في بوابة القمة</h1>
          <p className="text-slate-500 font-bold text-lg">لقد وجدنا سجلات متعددة مرتبطة برقم هاتفك، يرجى اختيار السجل الذي ترغب في متابعته:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {availableRecords.map((record) => (
             <button 
              key={record.id} 
              onClick={() => setSelectedStudentId(record.id)}
              className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-50 hover:border-emerald-500 hover:shadow-2xl transition-all text-right group relative overflow-hidden flex flex-col items-start"
             >
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all"></div>
                <div className="flex items-center gap-4 mb-6">
                   <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <User size={28} />
                   </div>
                   <div>
                      <p className="font-black text-2xl text-slate-900">{record.name}</p>
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">الصف {record.grade}</p>
                   </div>
                </div>
                
                <div className="w-full space-y-4 pt-6 border-t border-slate-50">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400">المدرس المسؤول:</span>
                      <span className="text-sm font-black text-slate-700 flex items-center gap-2"><Briefcase size={14} className="text-indigo-400"/> {record.teacher_name}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400">الفترة الدراسية:</span>
                      <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500">{record.academic_year}</span>
                   </div>
                </div>

                <div className="mt-8 self-end text-emerald-600 font-black text-xs flex items-center gap-2 group-hover:translate-x-[-10px] transition-transform">
                   دخول المتابعة <ChevronLeft size={16} />
                </div>
             </button>
           ))}
        </div>
        
        <div className="text-center opacity-30 font-bold text-xs">
           Summit Parent Dashboard © 2025
        </div>
      </div>
    );
  }

  if (availableRecords.length === 0) return (
    <div className="bg-white p-20 rounded-[4rem] text-center shadow-2xl border border-slate-100">
      <Heart size={80} className="text-rose-200 mx-auto mb-8 animate-pulse" />
      <h2 className="text-3xl font-black text-slate-900 mb-4">أهلاً بك في بوابة ولي الأمر</h2>
      <p className="text-slate-400 font-bold max-w-md mx-auto">لم نجد حالياً طالباً مرتبطاً برقم هاتفك. يرجى التواصل مع الإدارة للتأكد من تسجيل بياناتك بشكل صحيح.</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 font-['Cairo'] text-right">
      {feedback && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[500] px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 font-black bg-emerald-600 text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />} 
          {feedback.msg}
        </div>
      )}

      {/* زر العودة للاختيار إذا كان هناك أكثر من سجل */}
      {availableRecords.length > 1 && (
        <button 
          onClick={() => { setSelectedStudentId(null); setStudent(null); }}
          className="bg-white text-emerald-600 px-8 py-4 rounded-[1.8rem] font-black border border-emerald-50 text-xs shadow-xl flex items-center gap-3 hover:bg-emerald-50 transition-all active:scale-95"
        >
          <ChevronLeft size={18} className="rotate-180" /> العودة لاختيار سجل آخر
        </button>
      )}

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] text-white shadow-2xl relative overflow-hidden group border border-emerald-500/20">
         <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="text-center lg:text-right">
               <span className="bg-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6 w-fit mx-auto lg:mx-0">
                 <Sparkles size={14} className="text-amber-300" /> متابعة الطالب مع الأستاذ {student?.teacher_name}
               </span>
               <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4 tracking-tighter">متابعة الطالب <br/><span className="text-emerald-300">{student?.name}</span></h1>
               <div className="flex gap-4 justify-center lg:justify-start">
                  <span className="bg-emerald-500/30 px-5 py-2 rounded-full font-black text-xs border border-white/10">الصف {student?.grade}</span>
                  <span className="bg-emerald-500/30 px-5 py-2 rounded-full font-black text-xs border border-white/10">{student?.academic_year}</span>
               </div>
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
        
        {/* FINANCIAL & LESSONS */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-all">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">المتبقي المالي</p>
                    <h4 className="text-4xl font-black text-rose-500 tracking-tighter">${student?.remaining_balance?.toLocaleString()}</h4>
                 </div>
                 <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-500 group-hover:scale-110 transition-transform"><Wallet size={36}/></div>
              </div>
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-all">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي الساعات</p>
                    <h4 className="text-4xl font-black text-emerald-600 tracking-tighter">{student?.total_hours || 0} <span className="text-sm">ساعة</span></h4>
                 </div>
                 <div className="bg-emerald-50 p-6 rounded-[2rem] text-emerald-600 group-hover:scale-110 transition-transform"><Clock size={36}/></div>
              </div>
           </div>

           {/* LESSONS HISTORY */}
           <div className="bg-white p-8 md:p-14 rounded-[4rem] shadow-2xl border border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600"></div>
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><BookOpen size={28} className="text-emerald-600"/> سجل الحصص والملاحظات</h3>
                 <span className="text-xs font-black text-slate-400">آخر 5 حصص</span>
              </div>
              <div className="space-y-6">
                 {lessons.slice(0, 5).map(l => (
                   <div key={l.id} className="p-8 bg-slate-50/50 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-emerald-100">
                      <div className="flex items-center gap-6">
                         <div className="bg-white p-4 rounded-2xl shadow-sm text-emerald-600 font-black text-center min-w-[70px] border border-slate-100">
                            <span className="text-[10px] block opacity-50 uppercase tracking-widest">{new Date(l.lesson_date).toLocaleDateString('ar-EG', {month: 'short'})}</span>
                            <span className="text-2xl">{new Date(l.lesson_date).getDate()}</span>
                         </div>
                         <div>
                            <p className="font-black text-slate-900 text-lg">حصة تعليمية</p>
                            <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-2 tracking-wide"><Clock size={12}/> {l.hours} ساعة تدريسية</p>
                         </div>
                      </div>
                      <div className="bg-emerald-50/50 px-6 py-4 rounded-2xl border border-dashed border-emerald-200 flex-1 w-full">
                         <p className="text-xs font-bold text-emerald-900 leading-relaxed italic">" {l.notes || 'لم يسجل المعلم ملاحظات تقييمية لهذه الحصة'} "</p>
                      </div>
                   </div>
                 ))}
                 {lessons.length === 0 && <div className="text-center py-10 opacity-30 italic">لا توجد حصص مسجلة بعد</div>}
              </div>
           </div>
        </div>

        {/* SIDEBAR: SCHEDULE & REQUESTS */}
        <div className="space-y-8">
           {/* SCHEDULE */}
           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-emerald-600/5"></div>
              <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Calendar size={22} className="text-emerald-400"/> الجدول الأسبوعي</h3>
              <div className="space-y-4 relative z-10">
                 {schedule.map(s => (
                   <div key={s.id} className="bg-white/5 border border-white/10 p-5 rounded-[1.8rem] flex justify-between items-center hover:bg-white/10 transition-all">
                      <div>
                         <p className="font-black text-sm">{s.day_of_week}</p>
                         <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-widest">{s.start_time} - {s.duration_hours}س</p>
                      </div>
                      <button onClick={() => handleApologize(s.day_of_week)} className="text-[10px] bg-rose-500/20 text-rose-400 px-5 py-2 rounded-full font-black hover:bg-rose-500 hover:text-white transition-all active:scale-95">اعتذار</button>
                   </div>
                 ))}
                 {schedule.length === 0 && <p className="text-center py-6 text-slate-500 italic text-xs">لا يوجد جدول محدد حالياً</p>}
              </div>
           </div>

           {/* SEND NOTE */}
           <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><MessageCircle size={22} className="text-emerald-600"/> رسالة خاصة للأستاذ</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSendRequest('note', note); }} className="space-y-4">
                 <textarea required placeholder="اكتب ملاحظاتك أو استفساراتك هنا..." className="w-full p-6 bg-slate-50 rounded-[2rem] h-32 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all shadow-inner resize-none" value={note} onChange={e => setNote(e.target.value)} />
                 <button disabled={sendingRequest} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95">
                    {sendingRequest ? <RefreshCw className="animate-spin" /> : <Send size={18}/>} إرسال الملاحظة
                 </button>
              </form>
           </div>

           {/* PAYMENT INTENT */}
           <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><DollarSign size={24}/></div>
                 <h4 className="font-black text-amber-900 text-lg">سداد مالي</h4>
              </div>
              <p className="text-xs font-bold text-amber-700 leading-relaxed mb-8">هل ترغب في تسوية دفعة مالية؟ يمكنك تحديد المبلغ المطلوب دفعه لإبلاغ الأستاذ بتجهيز السجل المالي.</p>
              <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] font-black shadow-xl transition-all active:scale-95">طلب سداد دفعة</button>
           </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[600] flex items-center justify-center p-6 text-right animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md p-10 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-all"><X size={32}/></button>
              <h2 className="text-2xl font-black mb-8 text-slate-900">تحديد مبلغ السداد</h2>
              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">المبلغ المنوي دفعه ($)</label>
                    <input required type="number" placeholder="0.00" className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-black text-5xl text-center text-amber-600 outline-none focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all shadow-inner" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                 </div>
                 <button onClick={() => handleSendRequest('payment_intent', `طلب سداد مبلغ ${paymentAmount}`, parseFloat(paymentAmount))} disabled={sendingRequest || !paymentAmount} className="w-full py-6 bg-amber-500 text-white font-black rounded-[2rem] shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-4 text-xl disabled:opacity-50">
                    {sendingRequest ? <RefreshCw className="animate-spin" /> : <CheckCircle size={28}/>} تأكيد إرسال الطلب
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
