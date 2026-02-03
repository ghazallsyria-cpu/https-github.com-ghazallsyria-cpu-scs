import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
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
        let qLessons = supabase.from('lessons').select('*');
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

        // بيانات وهمية للرسم البياني بناءً على البيانات
        setChartData([
          { name: 'شهر 1', hours: 10 },
          { name: 'شهر 2', hours: 25 },
          { name: 'شهر 3', hours: totalHours }
        ]);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [role, uid]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">جاري التحميل...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">نظرة عامة</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-indigo-600" />
        <StatCard label="الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-purple-600" />
        <StatCard label="الساعات" value={stats.totalHours} icon={<Clock size={20}/>} color="bg-emerald-600" />
        <StatCard label="الدخل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-blue-600" />
        <StatCard label="المتبقي" value={`$${stats.pendingPayments}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black mb-8">نشاط التدريس</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="hours" stroke="#4f46e5" fill="#4f46e533" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4`}>{icon}</div>
    <p className="text-slate-400 text-sm font-bold">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default Dashboard;