
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertCircle
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: color }) : icon}
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
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
      try {
        // جلب منفصل لضمان عدم انهيار التطبيق إذا فشل جدول واحد
        const studentsReq = await supabase.from('students').select('*', { count: 'exact' });
        const lessonsReq = await supabase.from('lessons').select('*');
        const paymentsReq = await supabase.from('payments').select('amount');

        const studentsData = studentsReq.data || [];
        const lessonsData = lessonsReq.data || [];
        const paymentsData = paymentsReq.data || [];
        const studentCount = studentsReq.count || studentsData.length;

        const totalHours = lessonsData.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
        const totalIncome = paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalAgreed = studentsData.reduce((sum, s) => sum + (Number(s.agreed_payment) || 0), 0);
        
        setStats({
          totalStudents: studentCount,
          totalLessons: lessonsData.length,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome)
        });

        const monthlyData: any = {};
        lessonsData.forEach(lesson => {
          const date = new Date(lesson.date);
          if (isNaN(date.getTime())) return;
          const month = date.toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + Number(lesson.hours);
        });

        const formattedChartData = Object.entries(monthlyData).map(([name, hours]) => ({ name, hours }));
        setChartData(formattedChartData.length > 0 ? formattedChartData : [{name: 'No Data', hours: 0}]);

      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center font-medium text-slate-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">General Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your current progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="Total Students" value={stats.totalStudents} icon={<Users size={20} />} color="text-indigo-600" />
        <StatCard label="Total Lessons" value={stats.totalLessons} icon={<Calendar size={20} />} color="text-purple-600" />
        <StatCard label="Total Hours" value={stats.totalHours} icon={<Clock size={20} />} color="text-emerald-600" />
        <StatCard label="Total Income" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign size={20} />} color="text-blue-600" />
        <StatCard label="Pending Payments" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<AlertCircle size={20} />} color="text-rose-600" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-8">Teaching Activity (Hours)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
              <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fill="#4f46e510" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
