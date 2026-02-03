import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
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

        // تجميع الساعات حسب التاريخ للرسم البياني
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">مرحباً بك في لوحة التحكم</h1>
        <p className="text-slate-500 font-bold">إليك ملخص سريع لأداء طلابك المالي والأكاديمي.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-indigo-600" />
        <StatCard label="عدد الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-purple-600" />
        <StatCard label="ساعات التدريس" value={stats.totalHours} icon={<Clock size={20}/>} color="bg-emerald-600" />
        <StatCard label="الدخل المحصل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-blue-600" />
        <StatCard label="المستحقات" value={`$${stats.pendingPayments}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-900">ساعات التدريس عبر الزمن</h3>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">بيانات حية</span>
        </div>
        <div className="h-72">
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
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-default group">
    <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-slate-400 text-sm font-bold">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
  </div>
);

export default Dashboard;