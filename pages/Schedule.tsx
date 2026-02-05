
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Clock, Plus, X, Trash2, Calendar, CheckCircle, AlertCircle, User, Info, Search, ChevronLeft, CalendarDays
} from 'lucide-react';

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const Schedule = ({ role, uid }: { role: any, uid: string }) => {
  const todayIndex = new Date().getDay();
  const adjustedIndex = (todayIndex + 1) % 7; 
  const [selectedDay, setSelectedDay] = useState(DAYS[adjustedIndex]);
  
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [form, setForm] = useState({
    student_id: '',
    start_time: '14:00',
    duration_hours: '1',
    notes: ''
  });

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let qStds = supabase.from('students').select('id, name, grade');
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      const { data: stds } = await qStds;
      setStudents(stds || []);

      let qSched = supabase.from('schedules')
        .select('*, students(name, grade)')
        .eq('day_of_week', selectedDay);
      
      if (!isAdmin) qSched = qSched.eq('teacher_id', uid);
      
      const { data: schedData, error } = await qSched.order('start_time');
      if (error) throw error;
      setScheduleItems(schedData || []);
    } catch (e: any) {
      showFeedback("خطأ في جلب البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedDay, uid, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) return showFeedback("يرجى اختيار طالب أولاً", "error");
    
    try {
      const { error } = await supabase.from('schedules').insert([{
        teacher_id: uid,
        student_id: form.student_id,
        day_of_week: selectedDay,
        start_time: form.start_time,
        duration_hours: parseFloat(form.duration_hours),
        notes: form.notes
      }]);
      
      if (error) throw error;
      
      showFeedback("تمت إضافة الحصة للجدول بنجاح");
      setIsModalOpen(false);
      setForm({ student_id: '', start_time: '14:00', duration_hours: '1', notes: '' });
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد من الجدول؟')) return;
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      showFeedback("تم حذف الموعد");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    let h = parseInt(hours);
    const m = minutes;
    const ampm = h >= 12 ? 'مساءً' : 'صباحاً';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-right">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">الجدول الأسبوعي</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">تنسيق مواعيد الحصص اليومية</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 text-sm flex items-center gap-3 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
          إضافة حصة مجدولة
        </button>
      </div>

      {/* Days Tabs */}
      <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm no-scrollbar">
         {DAYS.map(day => (
           <button 
             key={day} 
             onClick={() => setSelectedDay(day)}
             className={`flex-1 min-w-[90px] md:min-w-0 py-4 rounded-[1.5rem] font-black text-xs md:text-sm transition-all ${selectedDay === day ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             {day}
           </button>
         ))}
      </div>

      {/* Schedule Items List */}
      <div className="space-y-4 animate-in fade-in duration-500 text-right">
         {scheduleItems.length > 0 ? (
           scheduleItems.map((item) => (
             <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-500 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-6 w-full md:w-auto">
                   <div className="bg-slate-50 text-indigo-600 w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
                      <span className="text-xl leading-none">{formatTime(item.start_time).split(' ')[0]}</span>
                      <span className="text-[9px] mt-1">{formatTime(item.start_time).split(' ')[1]}</span>
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 mb-1">{item.students?.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-slate-400 font-bold text-xs">
                         <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-500">{item.students?.grade}</span>
                         <span className="flex items-center gap-1"><Clock size={12}/> {item.duration_hours} حصة/ساعة</span>
                         {item.notes && <span className="text-indigo-500 italic flex items-center gap-1">| <Info size={12}/> {item.notes}</span>}
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                   <button 
                     onClick={() => handleDelete(item.id)}
                     className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                     title="إلغاء الموعد"
                   >
                      <Trash2 size={20}/>
                   </button>
                </div>
             </div>
           ))
         ) : (
           <div className="py-24 text-center bg-white rounded-[3.5rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Clock size={64} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-xl">لا توجد حصص مجدولة لهذا اليوم.</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">أضف موعدك الأول ليوم {selectedDay}</button>
           </div>
         )}
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddSchedule} 
            className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in duration-300 text-right border border-slate-100"
          >
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-10 left-10 text-slate-300 hover:text-rose-500 transition-colors">
              <X size={28}/>
            </button>
            <h2 className="text-2xl font-black mb-8 text-slate-900 flex items-center gap-3">
              <Plus className="text-indigo-600" /> موعد جديد ({selectedDay})
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3">اختيار الطالب من القائمة</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <select 
                    required 
                    className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" 
                    value={form.student_id} 
                    onChange={e => setForm({...form, student_id: e.target.value})}
                  >
                    <option value="">-- اختر طالب --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3">وقت البدء</label>
                   <input required type="time" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3">عدد الحصص/المدة</label>
                   <input required type="number" step="0.5" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={form.duration_hours} onChange={e => setForm({...form, duration_hours: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3">ملاحظات (اختياري)</label>
                <textarea placeholder="مثال: مراجعة الوحدة الثانية.." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all h-28 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-lg">تأكيد الإضافة للجدول</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Schedule;
