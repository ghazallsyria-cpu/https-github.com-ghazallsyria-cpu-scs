
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Dashboard = ({ role, profile }: any) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    lessonsCount: 0,
    totalIncome: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        let qStds = supabase.from('student_summary_view').select('*');
        if (!isAdmin) qStds = qStds.eq('teacher_id', profile.id);
        const { data: stds } = await qStds;

        let qLss = supabase.from('lessons').select('id');
        if (!isAdmin) qLss = qLss.eq('teacher_id', profile.id);
        const { data: lss } = await qLss;

        let qPay = supabase.from('payments').select('amount');
        if (!isAdmin) qPay = qPay.eq('teacher_id', profile.id);
        const { data: pays } = await qPay;

        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: (pays || []).reduce((acc, c) => acc + Number(c.amount || 0), 0),
          pendingPayments: (stds || []).reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0),
        });
      } catch (err) {
        console.error("Dashboard Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAdmin, profile?.id]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400">تحليل المنجزات...</p>
    </div>
  );

  const chartData = [
    { name: 'المحصل', value: stats.totalIncome, fill: '#4f46e5' },
    { name: 'المتبقي', value: stats.pendingPayments, fill: '#f43f5e' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 leading-none mb-4">مركز <span className="text-indigo-600">الإدارة</span></h1>
          <p className="text-slate-400 font-bold text-lg">مرحباً {profile?.full_name || '...'}، إليك ملخص نشاطك الحالي.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-sm border">
           <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={20} /></div>
           <div className="pr-4 pl-8"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">التحديث الأخير</p><p className="font-black text-slate-900">مباشر الآن</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب" value={stats.studentsCount} sub="إجمالي الطلاب" icon={<Users />} color="blue" />
        <StatCard label="الحصص" value={stats.lessonsCount} sub="حصة تعليمية" icon={<Calendar />} color="indigo" />
        <StatCard label="المحصل" value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي المبالغ" icon={<DollarSign />} color="emerald" />
        <StatCard label="المتبقي" value={`$${stats.pendingPayments.toLocaleString()}`} sub="ديون قيد التحصيل" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border shadow-sm min-h-[450px]">
           <h3 className="text-2xl font-black text-slate-900 mb-8">التقرير المالي البياني</h3>
           <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={60}>
                       {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
           <div className="relative z-10">
              <div className="bg-indigo-600/40 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-400 mb-8 border border-white/10"><Award size={32} /></div>
              <h3 className="text-3xl font-black mb-4">تحليل <span className="text-indigo-400">القمة</span></h3>
              <p className="text-slate-400 font-bold leading-relaxed">
                {isAdmin ? 'نظام الرقابة المركزية يتيح لك متابعة كافة المعلمين والطلاب وحركاتهم المالية.' : 'تتبع مجهودك الأكاديمي وحصادك المالي بكل سهولة.'}
              </p>
           </div>
           <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => {
  const themes: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-lg transition-all group">
      <div className={`${themes[color]} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{React.cloneElement(icon, { size: 28 })}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
      <p className="text-xs font-bold text-slate-300">{sub}</p>
    </div>
  );
};

export default Dashboard;
