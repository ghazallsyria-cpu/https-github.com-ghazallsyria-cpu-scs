
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { CalendarDays, Plus, Clock, Trash2, User, X, AlertTriangle, RefreshCw, Users } from 'lucide-react';

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const Schedule = ({ role, uid }: { role: any, uid: string }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ student_id: '', start_time: '16:00', duration: '2' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // جلب بنود الجدول لليوم المحدد
      const { data: sched, error: schedError } = await supabase
        .from('schedules')
        .select('*, students(name)')
        .eq('day_of_week', selectedDay)
        .eq('teacher_id', uid)
        .order('start_time');
      
      if (schedError) throw schedError;
      setScheduleItems(sched || []);
      
      // جلب قائمة كافة الطلاب المتاحين لهذا المعلم (ليتم اختيارهم في المودال)
      const { data: stds, error: stdsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('teacher_id', uid)
        .order('name');
        
      if (stdsError) throw stdsError;
      setStudents(stds || []);
    } catch (err) {
      console.error("Error fetching schedule data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDay, uid]);

  useEffect(() => { 
    if (uid) fetchData(); 
  }, [fetchData, uid]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) {
      alert("يرجى اختيار طالب أولاً.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('schedules').insert([{
        teacher_id: uid,
        student_id: form.student_id,
        day_of_week: selectedDay,
        start_time: form.start_time,
        duration_hours: parseFloat(form.duration)
      }]);
      
      if (error) throw error;
      setIsModalOpen(false);
      setForm({ ...form, student_id: '' });
      fetchData();
    } catch (err: any) {
      alert("خطأ في إضافة الموعد: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id);
    setConfirmDeleteId(null);
    fetchData();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6 text-right w-full">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><CalendarDays size={32} /></div>
            <div>
              <h2 className="text-3xl font-black">الجدول <span className="text-indigo-600">الأسبوعي</span></h2>
              <p className="text-slate-400 font-bold">نظم مواعيد حصصك بدقة واحترافية.</p>
            </div>
         </div>
         <div className="flex items-center gap-4 w-full md:w-auto">
           <button onClick={fetchData} className="p-5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
           </button>
           <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:scale-105 transition-transform whitespace-nowrap w-full">
             <Plus size={22} /> إضافة موعد
           </button>
         </div>
      </div>

      <div className="flex overflow-x-auto gap-4 p-4 bg-white rounded-[2.5rem] no-scrollbar shadow-sm border border-slate-50">
         {DAYS.map(day => (
           <button key={day} onClick={() => setSelectedDay(day)} className={`px-12 py-5 rounded-full font-black transition-all whitespace-nowrap ${selectedDay === day ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {scheduleItems.length > 0 ? scheduleItems.map(item => (
           <div key={item.id} className="bg-white p-10 rounded-[3.5rem] border shadow-sm hover:shadow-xl transition-all flex items-center justify-between group overflow-hidden relative">
              <div className="flex items-center gap-6 text-right">
                 <div className="bg-slate-50 p-5 rounded-3xl text-indigo-600 font-black text-xl shadow-inner min-w-[90px] text-center">{item.start_time.slice(0, 5)}</div>
                 <div>
                    <h4 className="text-2xl font-black text-slate-900">{item.students?.name || 'طالب غير معروف'}</h4>
                    <p className="text-slate-400 font-bold text-sm">المدة: {item.duration_hours} ساعة</p>
                 </div>
              </div>
              <button onClick={() => setConfirmDeleteId(item.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={20} /></button>
           </div>
         )) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
               <CalendarDays size={48} className="mx-auto text-slate-100 mb-6" />
               <p className="text-slate-400 font-black text-xl">لا توجد مواعيد مسجلة ليوم {selectedDay}</p>
            </div>
         )}
      </div>

      {/* Confirmation Delete Schedule */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto">
                 <AlertTriangle size={40} />
              </div>
              <div className="text-center">
                 <h3 className="text-2xl font-black mb-2">حذف الموعد من الجدول؟</h3>
                 <p className="text-slate-500 font-bold">هذا الإجراء سيؤدي لإزالة الموعد المخصص للطالب في يوم {selectedDay}.</p>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black">تراجع</button>
                 <button onClick={() => deleteSlot(confirmDeleteId)} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black shadow-lg">تأكيد الحذف</button>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <form onSubmit={handleAddSlot} className="bg-white w-full max-w-md p-12 rounded-[3.5rem] space-y-8 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center text-right">
                <h3 className="text-2xl font-black">إضافة حصة يوم {selectedDay}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-rose-50 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4 text-right">
                 <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500">اختر الطالب</label>
                    {students.length > 0 ? (
                      <select required className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-none ring-indigo-100 focus:ring-2" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                        <option value="">-- اختر طالب --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    ) : (
                      <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm flex items-center gap-3">
                         <Users size={18} /> لا يوجد طلاب متاحون، يرجى إضافة طلاب أولاً.
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-500">وقت البدء</label>
                       <input type="time" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-none ring-indigo-100 focus:ring-2" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-500">المدة (ساعات)</label>
                       <input type="number" step="0.5" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-none ring-indigo-100 focus:ring-2" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                    </div>
                 </div>
              </div>
              <button type="submit" disabled={loading || students.length === 0} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {loading ? <RefreshCw className="animate-spin" /> : null} حفظ الموعد
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Schedule;
