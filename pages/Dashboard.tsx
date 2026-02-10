
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, Activity, TrendingUp, ShieldCheck, ArrowUpRight, History, Star
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const Dashboard = ({ profile, isAdminActual, monitoredTeacher }: any) => {
  const [stats, setStats] = useState<any>({
    studentsCount: 0, lessonsCount: 0, totalIncome: 0, pendingPayments: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isGlobalView = isAdminActual && !monitoredTeacher;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const teacherId = isGlobalView ? null : (monitoredTeacher?.id || profile?.id);

        let qStds = supabase.from('student_summary_view').select('*');
        if (teacherId) qStds = qStds.eq('teacher_id', teacherId);
        const { data: stds } = await qStds;

        let qLss = supabase.from('lessons').select('id, created_at');
        if (teacherId) qLss = qLss.eq('teacher_id', teacherId);
        const { data: lss } = await qLss;

        let qPay = supabase.from('payments').select('amount, payment_date, students(name)');
        if (teacherId) qPay = qPay.eq('teacher_id', teacherId);
        const { data: pays } = await qPay.order('payment_date', { ascending: false }).limit(6);

        setRecentActivities(pays || []);
        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: stds?.reduce((acc, c) => acc + Number(c.total_paid || 0), 0) || 0,
          pendingPayments: stds?.reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0) || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher]);

  const chartData = useMemo(() => [
    { name: 'المحصل', value: stats.totalIncome, color: '#10b981' },
    { name: 'المعلق', value: stats.pendingPayments, color: '#f43f5e' }
  ], [stats]);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center">
      <div className="relative w-20 h-20">
         <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-6 font-black text-indigo-600 animate-pulse tracking-widest uppercase text-xs">Diamond Intelligence Loading...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-24 animate-diamond">
      {/* Platinum Header */}
      <div className="relative overflow-hidden bg-white p-10 md:p-14 rounded-[4rem] diamond-shadow border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="relative z-10 text-center md:text-right">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4">
             <Star size={12} fill="currentColor" /> النسخة الماسية البلاتينية
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-2">
            مرحباً، <span className="text-indigo-600">{profile?.full_name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 font-bold text-lg">إليك نبض النظام التعليمي والمالي لهذا اليوم.</p>
        </div>
        
        <div className="flex gap-6 relative z-10">
           <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-white text-center min-w-[120px]">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الطلاب</p>
              <p className="text-3xl font-black text-slate-900">{stats.studentsCount}</p>
           </div>
           <div className="bg-slate-900 p-6 rounded-[2.5rem] text-center min-w-[120px] shadow-xl shadow-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المادة</p>
              <p className="text-sm font-black text-white">{profile?.subjects || 'إدارة'}</p>
           </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب النشطون" value={stats.studentsCount} icon={<Users />} color="indigo" trend="+4%" />
        <StatCard label="الحصص المنفذة" value={stats.lessonsCount} icon={<Calendar />} color="blue" trend="+12" />
        <StatCard label="إجمالي المحصل" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign />} color="emerald" trend="آمن" />
        <StatCard label="الديون المعلقة" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<Wallet />} color="rose" trend="تنبيه" />
      </div>

      {/* Main Pulse & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pulse Timeline */}
        <div className="lg:col-span-1 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black flex items-center gap-3"><Activity className="text-indigo-400" /> نبض المالية</h3>
                 <History size={20} className="text-slate-600" />
              </div>
              
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                 {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all cursor-default">
                       <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-900/20">
                          ${act.amount}
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black leading-none mb-1">{act.students?.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{act.payment_date}</p>
                       </div>
                       <ArrowUpRight size={16} className="text-emerald-400 opacity-50" />
                    </div>
                 )) : (
                   <div className="flex flex-col items-center justify-center h-full opacity-30">
                      <Zap size={40} className="mb-4" />
                      <p className="text-xs font-black">لا نشاط حالي</p>
                   </div>
                 )}
              </div>
              
              <div className="mt-8 bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                 <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                    <span>معدل التحصيل</span>
                    <span className="text-indigo-400">88%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[88%] rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                 </div>
              </div>
           </div>
           {/* Glow Effects */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 blur-[80px] rounded-full group-hover:bg-indigo-600/30 transition-all"></div>
        </div>

        {/* Financial Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] diamond-shadow border border-slate-50 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900">التحليل المالي الذكي</h3>
              <p className="text-xs font-bold text-slate-400">مقارنة التدفق النقدي الفعلي بالديون</p>
            </div>
            <div className="flex gap-2">
               <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
               <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={65}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 800, fontSize: 14, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 20}}
                  contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}}
                />
                <Bar dataKey="value" radius={[25, 25, 25, 25]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
             <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">${stats.totalIncome.toLocaleString()}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase">سيولة متوفرة</p>
             </div>
             <div className="text-center">
                <p className="text-2xl font-black text-rose-600">${stats.pendingPayments.toLocaleString()}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase">ديون خارجية</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, trend }: any) => {
  const configs: any = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', shadow: 'shadow-indigo-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', shadow: 'shadow-rose-100' },
  };
  const config = configs[color];

  return (
    <div className="platinum-card p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className={`w-14 h-14 ${config.bg} ${config.text} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 leading-none">{value}</h4>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 text-[10px] font-black text-slate-500">
           <TrendingUp size={12} className={color === 'emerald' ? 'text-emerald-500' : ''} /> {trend}
        </div>
      </div>
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${config.bg} opacity-10 rounded-full blur-2xl`}></div>
    </div>
  );
};

export default Dashboard;
