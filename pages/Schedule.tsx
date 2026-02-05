
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  Clock, Plus, X, Trash2, CalendarDays, CheckCircle, AlertCircle, User, Info, RefreshCw, Edit3, Save
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditingId(null);
    setForm({ student_id: '', start_time: '14:00', duration_hours: '1', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setForm({
      student_id: item.student_id,
      start_time: item.start_time,
      duration_hours: item.duration_hours.toString(),
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) return showFeedback("يرجى اختيار طالب أولاً", "error");
    
    setLoading(true);
    try {
      const payload = {
        teacher_id: uid,
        student_id: form.student_id,
        day_of_week: selectedDay,
        start_time: form.start_time,
        duration_hours: parseFloat(form.duration_hours),
        notes: form.notes
      };

      if (isEditMode && editingId) {
        const { error } = await supabase.from('schedules').update(payload).eq('id', editingId);
        if (error) throw error;
        showFeedback("تم تحديث الموعد بنجاح");
      } else {
        const { error } = await supabase.from('schedules').insert([payload]);
        if (error) throw error;
        showFeedback("تمت إضافة الموعد للجدول");
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
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
    const ampm = h >= 12 ? 'مساءً' : 'صباحاً';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top duration-700 pb-20 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
            <CalendarDays size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">الجدول الأسبوعي</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">تنسيق مواعيد الحصص اليومية</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl transition-all active:scale-95 text-sm flex items-center gap-3 group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform" /> 
          حصة مجدولة جديدة
        </button>
      </div>

      <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm no-scrollbar">
         {DAYS.map(day => (
           <button 
             key={day} 
             onClick={() => setSelectedDay(day)}
             className={`flex-1 min-w-[100px] py-5 rounded-[2rem] font-black text-xs md:text-sm transition-all ${selectedDay === day ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             {day}
           </button>
         ))}
      </div>

      <div className="space-y-6">
         {loading ? (
           <div className="py-20 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" size={40} /></div>
         ) : scheduleItems.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {scheduleItems.map((item) => (
               <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center gap-6">
                     <div className="bg-slate-50 text-indigo-600 w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100">
                        <span className="text-2xl leading-none">{formatTime(item.start_time).split(' ')[0]}</span>
                        <span className="text-[10px] mt-2 uppercase tracking-widest">{formatTime(item.start_time).split(' ')[1]}</span>
                     </div>
                     <div>
                        <h4 className="text-2xl font-black text-slate-900 mb-1">{item.students?.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-wide">
                           <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-500">الصف {item.students?.grade}</span>
                           <span className="flex items-center gap-1"><Clock size={12}/> {item.duration_hours} س</span>
                           {item.notes && <span className="text-indigo-500 italic flex items-center gap-1">| {item.notes}</span>}
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                     <button onClick={() => handleOpenEdit(item)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit3 size={20}/></button>
                     <button onClick={() => handleDelete(item.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
                  </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="py-24 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
              <Clock size={80} className="text-slate-100 mb-6" />
              <p className="text-slate-400 font-black text-2xl">يوم {selectedDay} فارغ حالياً.</p>
              <button onClick={handleOpenAdd} className="mt-4 text-indigo-600 font-black text-sm hover:underline">سجل أول موعد الآن</button>
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveSchedule} className="bg-white w-full max-w-md p-12 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300 text-right">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-12 left-12 text-slate-300 hover:text-rose-500"><X size={32}/></button>
            <h2 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-4">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                {isEditMode ? <Edit3 size={24}/> : <Plus size={24}/>}
              </div>
              {isEditMode ? 'تعديل موعد' : 'إضافة موعد لليوم'}
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">الطالب</label>
                <select required className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-black focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                    <option value="">-- اختر طالب --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">البدء</label>
                   <input required type="time" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">المدة (س)</label>
                   <input required type="number" step="0.5" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={form.duration_hours} onChange={e => setForm({...form, duration_hours: e.target.value})} />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">ملاحظات</label>
                <textarea placeholder="اختياري..." className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all h-28 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 text-lg">
                {isEditMode ? <Save size={24}/> : <Plus size={24}/>}
                {isEditMode ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Schedule;
