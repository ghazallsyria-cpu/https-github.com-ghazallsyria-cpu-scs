
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp, BarChart3, ArrowUpRight, LayoutGrid } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, 
    totalLessons: 0, 
    totalHours: 0, 
    totalIncome: 0, 
    pendingPayments: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('student_summary_view')
          .select('total_lessons, total_hours, total_paid, expected_income, remaining_balance')
          .eq('academic_year', year)
          .eq('semester', semester);
        
        if (!isAdmin) query = query.eq('teacher_id', uid);
        
        const { data: stdData, error } = await query;
        if (error) throw error;

        const totals = (stdData || []).reduce((acc, curr) => ({
          students: acc.students + 1,
          lessons: acc.lessons + curr.total_lessons,
          hours: acc.hours + curr.total_hours,
          income: acc.income + curr.total_paid,
          debts: acc.debts + Math.max(0, curr.remaining_balance)
        }), { students: 0, lessons: 0, hours: 0, income: 0, debts: 0 });

        setStats({
          totalStudents: totals.students,
          totalLessons: totals.lessons,
          totalHours: totals.hours,
          totalIncome: totals.income,
          pendingPayments: totals.debts
        });

        let lQuery = supabase.from('lessons')
          .select('lesson_date, hours')
          .order('lesson_date', { ascending: false })
          .limit(50);
        
        if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
        const { data: lsns } = await lQuery;

        const grouped = (lsns || []).reverse().reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});

        setChartData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })));

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, uid, year, semester]);

  const collectionRate = Math.round((stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100);

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-right">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">{year}</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">الفصل الدراسي {semester}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">أداء الفصل الدراسي</h1>
          <p className="text-slate-500 font-bold mt-2">بيانات مجمعة فورياً من محرك الحسابات السحابي.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-blue-600" />
        <StatCard label="إجمالي الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-indigo-600" />
        <StatCard label="مجموع الساعات" value={stats.totalHours.toFixed(1)} icon={<Clock size={20}/>} color="bg-amber-600" />
        <StatCard label="المقبوضات" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign size={20}/>} color="bg-emerald-600" />
        <StatCard label="الديون" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-[450px]">
          <h3 className="text-xl font-black flex items-center gap-3 text-slate-900 mb-10">
            <TrendingUp className="text-indigo-600" /> كثافة العمل الأخيرة
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo'}} />
                <Area type="monotone" dataKey="hours" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHours)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 p-20 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <BarChart3 size={200} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-3">الدخل الإجمالي المحقق</p>
            <h2 className="text-5xl font-black">${stats.totalIncome.toLocaleString()}</h2>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-black mt-4">
              <ArrowUpRight size={18} /> <span>زيادة مستمرة</span>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
             <div className="flex justify-between items-end mb-1">
                <p className="text-slate-500 text-[10px] font-black uppercase">نسبة التحصيل من الإجمالي</p>
                <span className="text-2xl font-black text-emerald-500">{collectionRate}%</span>
             </div>
             <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden p-0.5">
               <div 
                 className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                 style={{ width: `${collectionRate}%` }}
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
    <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
  </div>
);

export default Dashboard;
