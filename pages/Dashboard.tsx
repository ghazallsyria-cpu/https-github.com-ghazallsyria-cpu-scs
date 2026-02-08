
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, Activity, TrendingUp, ShieldCheck, ArrowUpRight, History
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const Dashboard = ({ profile, isAdminActual, monitoredTeacher }: any) => {
  const [stats, setStats] = useState<any>({
    studentsCount: 0, lessonsCount: 0, totalIncome: 0, pendingPayments: 0, activeLessonsLastWeek: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isGlobalView = isAdminActual && !monitoredTeacher;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const teacherId = isGlobalView ? null : (monitoredTeacher?.id || profile?.id);

        // جلب الطلاب والمالية
        let qStds = supabase.from('student_summary_view').select('*');
        if (teacherId) qStds = qStds.eq('teacher_id', teacherId);
        const { data: stds } = await qStds;

        // جلب الحصص
        let qLss = supabase.from('lessons').select('id, created_at, teacher_id');
        if (teacherId) qLss = qLss.eq('teacher_id', teacherId);
        const { data: lss } = await qLss;

        // جلب الدفعات
        let qPay = supabase.from('payments').select('amount, payment_date, students(name)');
        if (teacherId) qPay = qPay.eq('teacher_id', teacherId);
        const { data: pays } = await qPay.order('payment_date', { ascending: false }).limit(5);

        setRecentActivities(pays || []);
        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: stds?.reduce((acc, c) => acc + Number(c.total_paid || 0), 0) || 0,
          pendingPayments: stds?.reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0) || 0,
          activeLessonsLastWeek: (lss || []).filter(l => (new Date().getTime() - new Date(l.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000)).length
        });
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher]);

  const financialData = useMemo(() => [
    { name: 'المحصل', value: stats.totalIncome, color: '#10b981' },
    { name: 'المتبقي', value: stats.pendingPayments, color: '#f43f5e' }
  ], [stats]);

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="font-black text-indigo-600 animate-pulse">توليد تقارير النسخة الماسية...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Diamond Edition V5.0</span>
             {isGlobalView && <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase">إدارة عليا</span>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">مرحباً بك في <span className="text-indigo-600">القمة</span></h1>
          <p className="text-slate-400 font-bold">إليك ملخص الأداء المالي والتعليمي لليوم.</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">حالة المزامنة</p>
              <p className="font-black text-emerald-500 flex items-center gap-2">متصل ومحدث <Activity size={14} /></p>
           </div>
           <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase">العام الدراسي</p>
              <p className="font-black text-slate-900">2024 / 2025</p>
           </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب النشطون" value={stats.studentsCount} trend="+3%" icon={<Users />} color="indigo" />
        <StatCard label="الحصص المنجزة" value={stats.lessonsCount} trend="+12" icon={<Calendar />} color="blue" />
        <StatCard label="السيولة المحصلة" value={`$${stats.totalIncome.toLocaleString()}`} trend="ممتاز" icon={<DollarSign />} color="emerald" />
        <StatCard label="المستحقات المعلقة" value={`$${stats.pendingPayments.toLocaleString()}`} trend="تنبيه" icon={<Wallet />} color="rose" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-sm border border-slate-50 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black flex items-center gap-3"><TrendingUp className="text-indigo-600" /> تحليل التدفق المالي</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">محصل</span>
               <span className="flex items-center gap-1.5 text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl">متبقي</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} barSize={60}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 800, fontSize: 14}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}}
                />
                <Bar dataKey="value" radius={[20, 20, 20, 20]}>
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl flex flex-col relative overflow-hidden">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-indigo-500 rounded-2xl"><History size={24} /></div>
                 <h3 className="text-xl font-black">نبض النشاط المالي</h3>
              </div>
              
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                 {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                       <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          ${act.amount}
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-white">{act.students?.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{act.payment_date}</p>
                       </div>
                       <ArrowUpRight size={16} className="text-emerald-500" />
                    </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                       <Zap size={48} className="mb-4" />
                       <p className="font-black text-sm">لا يوجد دفعات مسجلة مؤخراً</p>
                    </div>
                 )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                 <div className="flex justify-between items-center text-xs font-black text-slate-400">
                    <span>كفاءة التحصيل</span>
                    <span className="text-emerald-400">%84</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[84%]"></div>
                 </div>
              </div>
           </div>
           <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-indigo-600/20 blur-[100px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-black text-slate-900">{value}</h4>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors[color]}`}>{trend}</span>
      </div>
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${colors[color]} opacity-10 rounded-full blur-2xl`}></div>
    </div>
  );
};

export default Dashboard;
