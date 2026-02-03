import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Statistics = ({ role, uid }: { role: any, uid: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      let query = supabase.from('lessons').select('*');
      if (role === 'teacher') {
        query = query.eq('teacher_id', uid);
      }
      
      const { data: lsns } = await query;
      const grouped = (lsns || []).reduce((acc: any, curr) => {
        const date = curr.lesson_date;
        acc[date] = (acc[date] || 0) + Number(curr.hours);
        return acc;
      }, {});
      
      const chartData = Object.entries(grouped)
        .map(([date, hours]) => ({ date, hours }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
      setData(chartData);
      setLoading(false);
    };
    fetchStats();
  }, [uid, role]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900">إحصائيات الدروس</h1>
        <p className="text-slate-500 font-bold">تحليل عدد الساعات التعليمية على مدار الوقت.</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[450px]">
        {loading ? (
           <div className="h-full flex items-center justify-center py-20">
             <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="hours" name="الساعات" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 font-bold">
            <p>لا توجد بيانات كافية لعرض الرسم البياني.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;