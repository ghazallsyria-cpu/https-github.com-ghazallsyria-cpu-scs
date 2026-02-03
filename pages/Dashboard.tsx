import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
import { Users, Calendar, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid }: { role: any, uid: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, 
    totalLessons: 0, 
    totalHours: 0, 
    totalIncome: 0, 
    pendingPayments: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let qStudents = supabase.from('students').select('*');
        let qLessons = supabase.from('lessons').select('*').order('lesson_date', { ascending: true });
        let qPayments = supabase.from('payments').select('*');

        if (role === 'teacher') {
          qStudents = qStudents.eq('teacher_id', uid);
          qLessons = qLessons.eq('teacher_id', uid);
          qPayments = qPayments.eq('teacher_id', uid);
        }

        const [{ data: stds }, { data: lsns }, { data: pays }] = await Promise.all([qStudents, qLessons, qPayments]);

        const totalHours = (lsns || []).reduce((sum, l) => sum + Number(l.hours), 0);
        const totalIncome = (pays || []).reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAgreed = (stds || []).reduce((sum, s) => sum + Number(s.agreed_amount), 0);

        setStats({
          totalStudents: stds?.length || 0,
          totalLessons: lsns?.length || 0,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome)
        });

        const groupedData = (lsns || []).reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + curr.hours;
          return acc;
        }, {});

        const formattedChartData = Object.entries(groupedData).map(([name, hours]) => ({ name, hours }));
        setChartData(formattedChartData.length > 0 ? formattedChartData : [{name: 'لا بيانات', hours: 0}]);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [role, uid]);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900">لوحة التحكم</h1>
        <p className="text-slate-500 font-bold">ملخص شامل لأداء المعلم والطلاب.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-indigo-600" />
        <StatCard label="الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-purple-600" />
        <StatCard label="الساعات" value={stats.totalHours} icon={<Clock size={20}/>} color="bg-emerald-600" />
        <StatCard label="المحصل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-blue-600" />
        <StatCard label="الديون" value={`$${stats.pendingPayments}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
        <h3 className="text-lg font-black mb-6">تطور ساعات التدريس</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="hours" stroke="#4f46e5" fill="#4f46e520" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
    <div className={`${color} w-8 h-8 rounded-lg flex items-center justify-center text-white mb-3`}>{icon}</div>
    <p className="text-slate-400 text-xs font-bold">{label}</p>
    <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default Dashboard;