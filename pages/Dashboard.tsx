
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
        {icon}
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const { data: studentsData, error: sErr } = await supabase.from('students').select('*');
        if (sErr) throw sErr;

        const { data: lessonsData } = await supabase.from('lessons').select('*');
        const { data: paymentsData } = await supabase.from('payments').select('amount');

        if (!isMounted) return;

        const totalHours = (lessonsData || []).reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
        const totalIncome = (paymentsData || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalAgreed = (studentsData || []).reduce((sum, s) => sum + (Number(s.agreed_payment) || 0), 0);
        
        setStats({
          totalStudents: studentsData?.length || 0,
          totalLessons: (lessonsData || []).length,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome)
        });

        const monthlyData: any = {};
        (lessonsData || []).forEach(lesson => {
          const date = new Date(lesson.lesson_date);
          if (isNaN(date.getTime())) return;
          const m = date.toLocaleString('ar-EG', { month: 'short' });
          monthlyData[m] = (monthlyData[m] || 0) + Number(lesson.hours);
        });
        
        const formattedData = Object.entries(monthlyData).map(([name, hours]) => ({ name, hours }));
        setChartData(formattedData.length > 0 ? formattedData : [{ name: 'لا بيانات', hours: 0 }]);
      } catch (err: any) { 
        console.error('Dashboard fetch error:', err);
        if (isMounted) setError('تعذر الاتصال بقاعدة البيانات. تأكد من إعداد الجداول.');
      } finally { 
        if (isMounted) setLoading(false); 
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-500 font-bold">جاري تحميل لوحة التحكم...</p>
    </div>
  );

  if (error) return (
    <div className="p-20 text-center">
      <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
      <p className="text-slate-800 font-black text-xl mb-2">خطأ في التحميل</p>
      <p className="text-slate-500 font-bold">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">إعادة المحاولة</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900">نظرة عامة</h1>
        <p className="text-slate-500 mt-1 font-bold">إليك ملخص لنشاطك التعليمي الحالي.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="إجمالي الطلاب" value={stats.totalStudents} icon={<Users size={20} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard label="إجمالي الحصص" value={stats.totalLessons} icon={<Calendar size={20} className="text-purple-600" />} color="bg-purple-50" />
        <StatCard label="ساعات التدريس" value={stats.totalHours} icon={<Clock size={20} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard label="الدخل المحصل" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign size={20} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="مبالغ معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<AlertCircle size={20} className="text-rose-600" />} color="bg-rose-50" />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-black text-slate-900 mb-8 text-right">نشاط التدريس (ساعات شهرياً)</h3>
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
