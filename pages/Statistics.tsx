
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
  PieChart,
  Pie,
  Cell,
  Legend
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
        const startOfDay = new Date(new Date().setHours(0,0,0,0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfSemester = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);

        const dHours = (lessons || []).filter(l => new Date(l.date) >= startOfDay).reduce((s, l) => s + Number(l.hours), 0);
        const mHours = (lessons || []).filter(l => new Date(l.date) >= startOfMonth).reduce((s, l) => s + Number(l.hours), 0);
        const sHours = (lessons || []).filter(l => new Date(l.date) >= startOfSemester).reduce((s, l) => s + Number(l.hours), 0);
        const income = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

        setStats({ dayHours: dHours, monthHours: mHours, semesterHours: sHours, totalIncome: income });

        // نشاط آخر 7 أيام
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyMap: any = {};
        last7Days.forEach(day => dailyMap[day] = 0);
        lessons?.forEach(l => {
          if (dailyMap[l.date] !== undefined) dailyMap[l.date] += Number(l.hours);
        });

        setDailyData(Object.entries(dailyMap).map(([date, hours]) => ({ 
          date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }), 
          hours 
        })));

        // توزيع الطلاب بناءً على الساعات
        const studentMap: any = {};
        lessons?.forEach(l => {
          const sName = students?.find(s => s.id === l.student_id)?.name || 'طالب مجهول';
          studentMap[sName] = (studentMap[sName] || 0) + Number(l.hours);
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

  if (loading) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-500 font-bold">جاري حساب الإحصائيات وتحليل البيانات...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">تحليلات الأداء</h1>
          <p className="text-slate-500 mt-1 font-bold">تحليل مفصل لساعات التدريس والنمو المالي.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold shadow-sm">
          <Calendar size={18} />
          <span>آخر 30 يوم</span>
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <p className="text-indigo-100 text-sm font-bold mb-1">ساعات اليوم</p>
          <div className="flex items-center justify-between">
            <p className="text-4xl font-black">{stats.dayHours}</p>
            <Clock size={32} className="text-indigo-300 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm font-bold mb-1">ساعات هذا الشهر</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-slate-900">{stats.monthHours}</p>
            <div className="p-2 bg-emerald-50 rounded-xl"><TrendingUp size={24} className="text-emerald-500" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm font-bold mb-1">إجمالي الفصل الدراسي</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-slate-900">{stats.semesterHours}</p>
            <div className="p-2 bg-blue-50 rounded-xl"><Calendar size={24} className="text-blue-500" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm font-bold mb-1">إجمالي الدخل المحصل</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-slate-900">${stats.totalIncome.toLocaleString()}</p>
            <div className="p-2 bg-emerald-50 rounded-xl"><DollarSign size={24} className="text-emerald-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8">عبء التدريس (يومي)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', textAlign: 'right', fontWeight: 'bold'}} />
                <Bar dataKey="hours" name="ساعات" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8">توزيع الساعات حسب الطالب</h3>
          <div className="h-72">
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
                  nameKey="name"
                >
                  {studentDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontWeight: 'bold'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
