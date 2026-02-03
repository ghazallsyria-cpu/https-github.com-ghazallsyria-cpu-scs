
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock,
  ChevronDown
} from 'lucide-react';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b'];

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dayHours: 0,
    monthHours: 0,
    semesterHours: 0,
    totalIncome: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [studentDistribution, setStudentDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: lessons } = await supabase.from('lessons').select('*');
        const { data: payments } = await supabase.from('payments').select('*');
        const { data: students } = await supabase.from('students').select('id, name');

        const now = new Date();
        const startOfDay = new Date(now.setHours(0,0,0,0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfSemester = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);

        const dHours = (lessons || []).filter(l => new Date(l.date) >= startOfDay).reduce((s, l) => s + l.hours, 0);
        const mHours = (lessons || []).filter(l => new Date(l.date) >= startOfMonth).reduce((s, l) => s + l.hours, 0);
        const sHours = (lessons || []).filter(l => new Date(l.date) >= startOfSemester).reduce((s, l) => s + l.hours, 0);
        const income = (payments || []).reduce((s, p) => s + p.amount, 0);

        setStats({ dayHours: dHours, monthHours: mHours, semesterHours: sHours, totalIncome: income });

        // Daily Activity for the last 7 days
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyMap: any = {};
        last7Days.forEach(day => dailyMap[day] = 0);
        lessons?.forEach(l => {
          if (dailyMap[l.date] !== undefined) dailyMap[l.date] += l.hours;
        });

        setDailyData(Object.entries(dailyMap).map(([date, hours]) => ({ 
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), 
          hours 
        })));

        // Student distribution
        const studentMap: any = {};
        lessons?.forEach(l => {
          const sName = students?.find(s => s.id === l.student_id)?.name || 'Unknown';
          studentMap[sName] = (studentMap[sName] || 0) + l.hours;
        });
        setStudentDistribution(Object.entries(studentMap).map(([name, value]) => ({ name, value })));

      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Calculating statistics...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Performance Analytics</h1>
          <p className="text-slate-500 mt-1">Detailed breakdown of teaching hours and financial growth.</p>
        </div>
        <button className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50">
          <Calendar size={18} />
          <span>Last 30 Days</span>
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white">
          <p className="text-indigo-100 text-sm font-medium mb-1">Hours Today</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold">{stats.dayHours}</p>
            <Clock size={24} className="text-indigo-300" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Hours this Month</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.monthHours}</p>
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Semester Total</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.semesterHours}</p>
            <Calendar size={24} className="text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Lifetime Income</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-slate-900">${stats.totalIncome.toLocaleString()}</p>
            <DollarSign size={24} className="text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Teaching Load (Daily)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Hours by Student</h3>
          <div className="h-72 flex flex-col sm:flex-row items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {studentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
