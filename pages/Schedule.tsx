import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { CalendarDays, Plus, Clock, RefreshCw } from 'lucide-react';

const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const Schedule = ({ role, uid }: { role: any, uid: string }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('schedules').select('*, students(name)').eq('day_of_week', selectedDay);
    if (role !== 'admin') q = q.eq('teacher_id', uid);
    const { data } = await q.order('start_time');
    setScheduleItems(data || []);
    setLoading(false);
  }, [selectedDay, uid, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8">
      <div className="flex overflow-x-auto gap-4 p-4 bg-white rounded-[2rem] no-scrollbar">
         {DAYS.map(day => (
           <button key={day} onClick={() => setSelectedDay(day)} className={`px-10 py-4 rounded-full font-black ${selectedDay === day ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{day}</button>
         ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {scheduleItems.map(item => (
           <div key={item.id} className="bg-white p-8 rounded-[3rem] border flex items-center gap-6">
              <div className="bg-slate-50 p-4 rounded-2xl text-indigo-600 font-black">{item.start_time}</div>
              <h4 className="text-2xl font-black">{item.students?.name}</h4>
           </div>
         ))}
      </div>
    </div>
  );
};

export default Schedule;