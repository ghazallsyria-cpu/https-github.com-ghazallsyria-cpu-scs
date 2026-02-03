import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp, UserCheck } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 text-right">
        <p className="font-black text-slate-900 mb-1">{label}</p>
        <p className="font-bold text-indigo-600">{`${payload[0].value} ساعة`}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = ({ role, uid }: { role: any, uid: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, 
    totalLessons: 0, 
    totalHours: 0, 
    totalIncome: 0, 
    pendingPayments: 0,
    totalTeachers: 0
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
        let qTeachers = supabase.from('profiles').select('*').eq('role', 'teacher');

        if (role === 'teacher') {
          qStudents = qStudents.eq('teacher_id', uid);
          qLessons = qLessons.eq('teacher_id', uid);
          qPayments = qPayments.eq('teacher_id', uid);
        }

        const [
          { data: students }, 
          { data: lessons }, 
          { data: payments }, 
          { data: teachers }
        ] = await Promise.all([qStudents, qLessons, qPayments, qTeachers]);

        const totalHours = (lessons || []).reduce((sum, l) => sum + Number(l.hours), 0);
        const totalIncome = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAgreed = (students || []).reduce((sum, s) => sum + Number(s.agreed_amount), 0);

        setStats({
          totalStudents: students?.length || 0,
          totalLessons: lessons?.length || 0,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome),
          totalTeachers: teachers?.length || 0
        });

        const monthlyData: any = {};
        const months = [...Array(6)].map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return d.toLocaleString('ar-EG', { month: 'short' });
        }).reverse();

        months.forEach(m => monthlyData[m] = 0);
        (lessons || []).forEach(l => {
          const m = new Date(l.lesson_date).toLocaleString('ar-EG', { month: 'short' });
          if (monthlyData[m] !== undefined) monthlyData[m] += Number(l.hours);
        });
        
        setChartData(Object.entries(monthlyData).map(([name, hours]) => ({ name, hours })));
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, uid]);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">جاري تحميل البيانات...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">مرحباً بك مجدداً</h1>
          <p className="text-slate-500 font-bold mt-1">
            {role === 'admin' ? 'لوحة تحكم المدير: نظرة شاملة على المركز.' : 'لوحة تحكم المعلم: تتبع طلابك وحصصك.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-indigo-600" />
        <StatCard label="الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-purple-600" />
        <StatCard label="الساعات" value={stats.totalHours} icon={<Clock size={20}/>} color="bg-emerald-600" />
        <StatCard label="الدخل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-blue-600" />
        {role === 'admin' ? (
          <StatCard label="المدرسون" value={stats.totalTeachers} icon={<UserCheck size={20}/>} color="bg-orange-600" />
        ) : (
          <StatCard label="المتبقي" value={`$${stats.pendingPayments}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
        )}
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24}/></div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">نشاط التدريس (بالساعات)</h3>
        </div>
        <div className="h-80">
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
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hours" name="ساعة" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-100/20`}>
      {icon}
    </div>
    <p className="text-slate-400 text-sm font-bold">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{String(value)}</p>
  </div>
);

export default Dashboard;