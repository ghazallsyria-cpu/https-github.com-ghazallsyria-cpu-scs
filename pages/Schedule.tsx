
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { CalendarDays, Plus, Clock, Trash2, Edit3, X, AlertTriangle, RefreshCw, Save } from 'lucide-react';

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const Schedule = ({ role, uid }: { role: any, uid: string }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ student_id: '', start_time: '16:00', duration: '2' });

  const fetchData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data: sched } = await supabase.from('schedules').select('*, students(name)').eq('day_of_week', selectedDay).eq('teacher_id', uid).order('start_time');
      setScheduleItems(sched || []);
      const { data: stds } = await supabase.from('students').select('id, name').eq('teacher_id', uid).order('name');
      setStudents(stds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDay, uid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (slot: any = null) => {
    setSelectedSlot(slot);
    if (slot) {
      setForm({ student_id: slot.student_id, start_time: slot.start_time.slice(0, 5), duration: slot.duration_hours.toString() });
    } else {
      setForm({ student_id: '', start_time: '16:00', duration: '2' });
    }
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        teacher_id: uid,
        student_id: form.student_id,
        day_of_week: selectedDay,
        start_time: form.start_time,
        duration_hours: parseFloat(form.duration)
      };

      if (selectedSlot) {
        await supabase.from('schedules').update(payload).eq('id', selectedSlot.id);
      } else {
        await supabase.from('schedules').insert([payload]);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
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
    <div className="space-y-8 pb-32 text-right" dir="rtl">
      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4 w-full">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100"><CalendarDays size={28} /></div>
            <div>
              <h2 className="text-2xl font-black">الجدول <span className="text-indigo-600">الأسبوعي</span></h2>
              <p className="text-slate-400 font-bold text-sm">تنظيم وتعديل مواعيد حصصك.</p>
            </div>
         </div>
         <button onClick={() => openModal()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all whitespace-nowrap w-full md:w-auto">
           <Plus size={20} /> موعد جديد
         </button>
      </div>

      <div className="flex overflow-x-auto gap-2 p-3 bg-white rounded-3xl no-scrollbar shadow-sm border border-slate-50">
         {DAYS.map(day => (
           <button key={day} onClick={() => setSelectedDay(day)} className={`px-8 py-3 rounded-2xl font-black transition-all whitespace-nowrap text-sm ${selectedDay === day ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {scheduleItems.length > 0 ? scheduleItems.map(item => (
           <div key={item.id} className="bg-white p-8 rounded-[2rem] border shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                 <div className="bg-slate-50 p-3 rounded-xl text-indigo-600 font-black text-center min-w-[70px] text-sm">{item.start_time.slice(0, 5)}</div>
                 <div>
                    <h4 className="text-lg font-black text-slate-900">{item.students?.name}</h4>
                    <p className="text-slate-400 font-bold text-[10px]">{item.duration_hours} ساعة</p>
                 </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => openModal(item)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600"><Edit3 size={16} /></button>
                 <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white"><Trash2 size={16} /></button>
              </div>
           </div>
         )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <CalendarDays size={40} className="mx-auto text-slate-100 mb-4" />
               <p className="text-slate-400 font-black">لا توجد مواعيد ليوم {selectedDay}</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
           <form onSubmit={handleSaveSlot} className="bg-white w-full max-w-md p-8 rounded-[2.5rem] space-y-6 animate-in zoom-in text-right">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-black">{selectedSlot ? 'تعديل موعد' : 'إضافة موعد'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full hover:text-rose-500"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500">اختر الطالب</label>
                    <select required className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                      <option value="">-- اختر طالب --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-xs font-black text-slate-500">وقت البدء</label>
                       <input type="time" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-black text-slate-500">المدة</label>
                       <input type="number" step="0.5" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                    </div>
                 </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                <Save size={20} /> حفظ الموعد
              </button>
           </form>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center space-y-6 animate-in zoom-in">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-black">حذف الموعد؟</h3>
              <div className="flex gap-3">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black">تراجع</button>
                 <button onClick={() => deleteSlot(confirmDeleteId)} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black">تأكيد</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
