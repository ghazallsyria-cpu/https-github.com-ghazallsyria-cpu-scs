
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid }: { role: any, uid: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let qStudents = supabase.from('students').select('*');
      let qLessons = supabase.from('lessons').select('*');
      let qPayments = supabase.from('payments').select('*');

      // إذا كان معلماً، نفلتر بـ ID الخاص به
      if (role === 'teacher') {
        qStudents = qStudents.eq('teacher_id', uid);
        qLessons = qLessons.eq('teacher_id', uid);
        qPayments = qPayments.eq('teacher_id', uid);
      }

      const { data: students } = await qStudents;
      const { data: lessons } = await qLessons;
      const { data: payments } = await qPayments;

      const totalHours = (lessons || []).reduce((sum, l) => sum + Number(l.hours), 0);
      const totalIncome = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const totalAgreed = (students || []).reduce((sum, s) => sum + Number(s.agreed_payment), 0);

      setStats({
        totalStudents: students?.length || 0,
        totalLessons: lessons?.length || 0,
        totalHours,
        totalIncome,
        pendingPayments: Math.max(0, totalAgreed - totalIncome)
      });

      const monthlyData: any = {};
      (lessons || []).forEach(l => {
        const m = new Date(l.lesson_date).toLocaleString('ar-EG', { month: 'short' });
        monthlyData[m] = (monthlyData[m] || 0) + Number(l.hours);
      });
      setChartData(Object.entries(monthlyData).map(([name, hours]) => ({ name, hours })));
      setLoading(false);
    };
    fetchData();
  }, [role, uid]);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">جاري تحميل الملخص...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900">مرحباً بك مجدداً</h1>
        <p className="text-slate-500 font-bold mt-1">
          {role === 'admin' ? 'نظرة عامة على نشاط جميع المعلمين في المنصة.' : 'نظرة عامة على طلابك وحصصك التعليمية.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-indigo-600" />
        <StatCard label="إجمالي الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-purple-600" />
        <StatCard label="ساعات التدريس" value={stats.totalHours} icon={<Clock size={20}/>} color="bg-emerald-600" />
        <StatCard label="المحصل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-blue-600" />
        <StatCard label="المتبقي" value={`$${stats.pendingPayments}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24}/></div>
          <h3 className="text-2xl font-black text-slate-900">منحنى الأداء التعليمي (ساعات)</h3>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
              <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
              <Area type="monotone" dataKey="hours" name="ساعة" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:scale-105 transition-transform">
    <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-100`}>
      {icon}
    </div>
    <p className="text-slate-400 text-sm font-bold">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default Dashboard;
