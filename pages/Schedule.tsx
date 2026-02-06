
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { CalendarDays, Plus, Clock, Trash2, User, X } from 'lucide-react';

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const Schedule = ({ role, uid }: { role: any, uid: string }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', start_time: '16:00', duration: '2' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: sched } = await supabase.from('schedules').select('*, students(name)').eq('day_of_week', selectedDay).eq('teacher_id', uid).order('start_time');
    setScheduleItems(sched || []);
    
    const { data: stds } = await supabase.from('students').select('id, name').eq('teacher_id', uid);
    setStudents(stds || []);
    setLoading(false);
  }, [selectedDay, uid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('schedules').insert([{
      teacher_id: uid,
      student_id: form.student_id,
      day_of_week: selectedDay,
      start_time: form.start_time,
      duration_hours: parseFloat(form.duration)
    }]);
    setIsModalOpen(false);
    fetchData();
  };

  const deleteSlot = async (id: string) => {
    if (confirm("هل تريد حذف هذا الموعد؟")) {
      await supabase.from('schedules').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white"><CalendarDays size={32} /></div>
            <div><h2 className="text-3xl font-black">الجدول <span className="text-indigo-600">الأسبوعي</span></h2><p className="text-slate-400 font-bold">نظم مواعيد حصصك بدقة واحترافية.</p></div>
         </div>
         <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3"><Plus size={22} /> إضافة موعد</button>
      </div>

      <div className="flex overflow-x-auto gap-4 p-4 bg-white rounded-[2.5rem] no-scrollbar shadow-sm">
         {DAYS.map(day => (
           <button key={day} onClick={() => setSelectedDay(day)} className={`px-12 py-5 rounded-full font-black transition-all whitespace-nowrap ${selectedDay === day ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{day}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {scheduleItems.length > 0 ? scheduleItems.map(item => (
           <div key={item.id} className="bg-white p-10 rounded-[3.5rem] border shadow-sm hover:shadow-xl transition-all flex items-center justify-between group">
              <div className="flex items-center gap-6">
                 <div className="bg-slate-50 p-5 rounded-3xl text-indigo-600 font-black text-xl">{item.start_time.slice(0, 5)}</div>
                 <div>
                    <h4 className="text-2xl font-black text-slate-900">{item.students?.name}</h4>
                    <p className="text-slate-400 font-bold text-sm">المدة: {item.duration_hours} ساعة</p>
                 </div>
              </div>
              <button onClick={() => deleteSlot(item.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
           </div>
         )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[4rem] border-2 border-dashed">
               <CalendarDays size={48} className="mx-auto text-slate-200 mb-6" />
               <p className="text-slate-400 font-black text-xl">لا توجد مواعيد مسجلة ليوم {selectedDay}</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
           <form onSubmit={handleAddSlot} className="bg-white w-full max-w-md p-12 rounded-[3.5rem] space-y-8">
              <h3 className="text-2xl font-black">إضافة حصة يوم {selectedDay}</h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-black">اختر الطالب</label>
                    <select required className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                       <option value="">-- اختر طالب --</option>
                       {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-black">وقت البدء</label>
                       <input type="time" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black">المدة (بالساعات)</label>
                       <input type="number" step="0.5" className="w-full p-5 bg-slate-50 rounded-2xl font-bold" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                    </div>
                 </div>
              </div>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl">حفظ الموعد</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 font-black">إلغاء</button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Schedule;
