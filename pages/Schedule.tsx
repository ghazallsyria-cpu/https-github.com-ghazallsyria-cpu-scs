
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { CalendarDays, Plus, Clock, Trash2, Edit3, X, AlertTriangle, RefreshCw, Users, Save } from 'lucide-react';

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
    <div className="space-y-10 pb-32">
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6 text-right w-full">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100"><CalendarDays size={32} /></div>
            <div>
              <h2 className="text-3xl font-black">الجدول <span className="text-indigo-600">الأسبوعي</span></h2>
              <p className="text-slate-400 font-bold">إدارة مواعيد حصصك وتعديلها بسهولة.</p>
            </div>
         </div>
         <button onClick={() => openModal()} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all whitespace-nowrap w-full md:w-auto">
           <Plus size={22} /> موعد جديد
         </button>
      </div>

      <div className="flex overflow-x-auto gap-4 p-4 bg-white rounded-[2.5rem] no-scrollbar shadow-sm border border-slate-50">
         {DAYS.map(day => (
           <button key={day} onClick={() => setSelectedDay(day)} className={`px-10 py-4 rounded-full font-black transition-all whitespace-nowrap ${selectedDay === day ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {scheduleItems.length > 0 ? scheduleItems.map(item => (
           <div key={item.id} className="bg-white p-10 rounded-[3.5rem] border shadow-sm hover:shadow-xl transition-all flex items-center justify-between group overflow-hidden relative">
              <div className="flex items-center gap-6">
                 <div className="bg-slate-50 p-4 rounded-2xl text-indigo-600 font-black text-center min-w-[80px]">{item.start_time.slice(0, 5)}</div>
                 <div>
                    <h4 className="text-xl font-black text-slate-900">{item.students?.name}</h4>
                    <p className="text-slate-400 font-bold text-xs">{item.duration_hours} ساعة</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => openModal(item)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600"><Edit3 size={18} /></button>
                 <button onClick={() => setConfirmDeleteId(item.id)} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white"><Trash2 size={18} /></button>
              </div>
           </div>
         )) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
               <CalendarDays size={48} className="mx-auto text-slate-100 mb-6" />
               <p className="text-slate-400 font-black text-xl">لا توجد مواعيد ليوم {selectedDay}</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl text-right">
           <form onSubmit={handleSaveSlot} className="bg-white w-full max-w-md p-12 rounded-[4rem] space-y-8 animate-in zoom-in">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">{selectedSlot ? 'تعديل موعد' : 'موعد جديد'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500">اختر الطالب</label>
                    <select required className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                      <option value="">-- اختر طالب --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-500">وقت البدء</label>
                       <input type="time" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-500">المدة (ساعات)</label>
                       <input type="number" step="0.5" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                    </div>
                 </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3">
                <Save size={24} /> حفظ الموعد
              </button>
           </form>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl text-center space-y-8 animate-in zoom-in">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={40} /></div>
              <h3 className="text-2xl font-black">حذف الموعد من الجدول؟</h3>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">تراجع</button>
                 <button onClick={() => deleteSlot(confirmDeleteId)} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black">تأكيد الحذف</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
