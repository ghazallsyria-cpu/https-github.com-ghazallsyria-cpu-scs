
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Added role to the props definition to fix the type error in App.tsx
const Statistics = ({ role, uid }: { role: any, uid: string }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Filter lessons by teacher_id only if the user is a teacher
      let query = supabase.from('lessons').select('*');
      if (role === 'teacher') {
        query = query.eq('teacher_id', uid);
      }
      
      const { data: lsns } = await query;
      const grouped = (lsns || []).reduce((acc: any, curr) => {
        const date = curr.lesson_date;
        acc[date] = (acc[date] || 0) + curr.hours;
        return acc;
      }, {});
      setData(Object.entries(grouped).map(([date, hours]) => ({ date, hours })));
    };
    fetchStats();
  }, [uid, role]); // Added role to dependency array

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">الإحصائيات</h1>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Statistics;
