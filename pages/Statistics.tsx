import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Activity, Users, Wallet, CreditCard } from 'lucide-react';

const Statistics = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [loading, setLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState({ totalRevenue: 0, totalDebt: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
    if (role !== 'admin') query = query.eq('teacher_id', uid);
    const { data } = await query;
    const rev = (data || []).reduce((s, r) => s + Number(r.total_paid || 0), 0);
    const debt = (data || []).reduce((s, r) => s + Math.max(0, Number(r.remaining_balance || 0)), 0);
    setFinancialStats({ totalRevenue: rev, totalDebt: debt });
    setLoading(false);
  }, [uid, role, year, semester]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const data = [
    { name: 'المحصل', value: financialStats.totalRevenue, fill: '#10b981' },
    { name: 'المتبقي', value: financialStats.totalDebt, fill: '#f59e0b' }
  ];

  return (
    <div className="space-y-12 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <div className="bg-white p-12 rounded-[4rem] border shadow-xl h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {data.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-center">
            <h3 className="text-3xl font-black mb-6">الوضع المالي</h3>
            <p className="text-emerald-400 text-5xl font-black">${financialStats.totalRevenue.toLocaleString()}</p>
            <p className="text-slate-400 mt-4">إجمالي التحصيل الفصلي</p>
         </div>
      </div>
    </div>
  );
};

export default Statistics;