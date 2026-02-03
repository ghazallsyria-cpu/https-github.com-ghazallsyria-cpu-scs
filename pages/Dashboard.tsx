import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
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
        let qSt = supabase.from('students').select('*');
        let qLe = supabase.from('lessons').select('*').order('lesson_date', { ascending: true });
        let qPa = supabase.from('payments').select('*');

        if (role === 'teacher') {
          qSt = qSt.eq('teacher_id', uid);
          qLe = qLe.eq('teacher_id', uid);
          qPa = qPa.eq('teacher_id', uid);
        }

        const [{ data: stds }, { data: lsns }, { data: pays }] = await Promise.all([qSt, qLe, qPa]);

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

        // تجميع الساعات حسب التاريخ للرسم البياني
        const grouped = (lsns || []).reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});

        const formatted = Object.entries(grouped).map(([name, hours]) => ({ name, hours }));
        setChartData(formatted.length > 0 ? formatted.slice(-7) : [{name: 'لا بيانات', hours: 0}]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, uid]);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900">نظرة عامة</h1>
        <p className="text-slate-500 font-bold">ملخص شامل لأداء الدروس والمالية.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-blue-600" />
        <StatCard label="الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-indigo-600" />
        <StatCard label="الساعات" value={stats.totalHours} icon={<Clock size={20}/>} color="bg-purple-600" />
        <StatCard label="المحصل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-emerald-600" />
        <StatCard label="الديون" value={`$${stats.pendingPayments}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black flex items-center gap-2">
              <TrendingUp className="text-indigo-600" /> ساعات العمل الأخيرة
            </h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip />
              <Area type="monotone" dataKey="hours" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-indigo-900 p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-indigo-300 font-bold uppercase text-xs tracking-widest mb-2">إجمالي الأرباح المتوقع</p>
            <h2 className="text-5xl font-black">${stats.totalIncome + stats.pendingPayments}</h2>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-indigo-300 text-sm">تم تحصيله</span>
               <span className="font-bold text-emerald-400">${stats.totalIncome}</span>
             </div>
             <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
               <div 
                 className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                 style={{ width: `${(stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100}%` }}
               />
             </div>
             <p className="text-[10px] text-indigo-400 font-bold text-center">بناءً على الاتفاقيات المالية مع الطلاب</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className={`${color} w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-slate-100`}>{icon}</div>
    <p className="text-slate-400 text-xs font-black uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default Dashboard;