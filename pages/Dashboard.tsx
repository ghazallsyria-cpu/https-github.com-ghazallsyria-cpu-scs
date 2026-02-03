
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, AlertCircle
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: color }) : icon}
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-bold">{label}</h3>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsReq = await supabase.from('students').select('*', { count: 'exact' });
        const lessonsReq = await supabase.from('lessons').select('*');
        const paymentsReq = await supabase.from('payments').select('amount');

        const studentsData = studentsReq.data || [];
        const lessonsData = lessonsReq.data || [];
        const paymentsData = paymentsReq.data || [];

        const totalHours = lessonsData.reduce((sum, l) => sum + Number(l.hours), 0);
        const totalIncome = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAgreed = studentsData.reduce((sum, s) => sum + Number(s.agreed_payment), 0);
        
        setStats({
          totalStudents: studentsReq.count || 0,
          totalLessons: lessonsData.length,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome)
        });

        const monthlyData: any = {};
        lessonsData.forEach(lesson => {
          const date = new Date(lesson.date);
          if (isNaN(date.getTime())) return;
          const m = date.toLocaleString('ar-EG', { month: 'short' });
          monthlyData[m] = (monthlyData[m] || 0) + Number(lesson.hours);
        });
        
        const formattedData = Object.entries(monthlyData).map(([name, hours]) => ({ name, hours }));
        setChartData(formattedData.length > 0 ? formattedData : [{ name: 'لا بيانات', hours: 0 }]);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-500 font-bold">جاري تحميل لوحة التحكم...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900">نظرة عامة</h1>
        <p className="text-slate-500 mt-1 font-bold">إليك ملخص لنشاطك التعليمي الحالي.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={<Users size={20} />} color="text-indigo-600" />
        <StatCard label="إجمالي الحصص" value={stats.totalLessons} icon={<Calendar size={20} />} color="text-purple-600" />
        <StatCard label="ساعات التدريس" value={stats.totalHours} icon={<Clock size={20} />} color="text-emerald-600" />
        <StatCard label="الدخل المحصل" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign size={20} />} color="text-blue-600" />
        <StatCard label="مبالغ معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<AlertCircle size={20} />} color="text-rose-600" />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-black text-slate-900 mb-8">نشاط التدريس (ساعات شهرياً)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', textAlign: 'right', fontWeight: 'bold'}} />
              <Area type="monotone" dataKey="hours" name="ساعات" stroke="#4f46e5" strokeWidth={4} fill="#4f46e510" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
