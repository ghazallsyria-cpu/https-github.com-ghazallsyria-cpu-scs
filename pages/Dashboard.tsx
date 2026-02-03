
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
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
  trend?: string;
}> = ({ label, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {/* Fix: cast icon to React.ReactElement<any> to allow dynamic className assignment */}
        {React.cloneElement(icon as React.ReactElement<any>, { className: color })}
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
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
        const [
          { count: studentCount },
          { data: lessonsData },
          { data: paymentsData },
          { data: studentsData }
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*'),
          supabase.from('payments').select('amount'),
          supabase.from('students').select('agreed_payment_amount')
        ]);

        const totalHours = (lessonsData || []).reduce((sum, l) => sum + (l.hours || 0), 0);
        const totalIncome = (paymentsData || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalAgreed = (studentsData || []).reduce((sum, s) => sum + (s.agreed_payment_amount || 0), 0);
        
        setStats({
          totalStudents: studentCount || 0,
          totalLessons: (lessonsData || []).length,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome)
        });

        // Group lessons by month for chart
        const monthlyData: any = {};
        lessonsData?.forEach(lesson => {
          const date = new Date(lesson.date);
          const month = date.toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + lesson.hours;
        });

        const formattedChartData = Object.entries(monthlyData).map(([name, hours]) => ({ name, hours }));
        setChartData(formattedChartData);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-slate-200 w-48 rounded mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-2xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">General Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, here's an overview of your tutoring business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          label="Total Students" 
          value={stats.totalStudents} 
          icon={<Users size={20} />} 
          color="text-indigo-600" 
          trend="+2 new"
        />
        <StatCard 
          label="Total Lessons" 
          value={stats.totalLessons} 
          icon={<Calendar size={20} />} 
          color="text-purple-600" 
        />
        <StatCard 
          label="Total Hours" 
          value={stats.totalHours} 
          icon={<Clock size={20} />} 
          color="text-emerald-600" 
        />
        <StatCard 
          label="Total Income" 
          value={`$${stats.totalIncome.toLocaleString()}`} 
          icon={<DollarSign size={20} />} 
          color="text-blue-600" 
        />
        <StatCard 
          label="Pending Payments" 
          value={`$${stats.pendingPayments.toLocaleString()}`} 
          icon={<AlertCircle size={20} />} 
          color="text-rose-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Teaching Activity</h3>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Monthly View</option>
              <option>Weekly View</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Trends</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">New Students</p>
                  <p className="text-xs text-slate-500">Last 30 days</p>
                </div>
              </div>
              <span className="text-emerald-600 font-bold">+12%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Avg Session</p>
                  <p className="text-xs text-slate-500">Efficiency</p>
                </div>
              </div>
              <span className="text-indigo-600 font-bold">1.5h</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Late Payments</p>
                  <p className="text-xs text-slate-500">Urgent follow-up</p>
                </div>
              </div>
              <span className="text-rose-600 font-bold">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
