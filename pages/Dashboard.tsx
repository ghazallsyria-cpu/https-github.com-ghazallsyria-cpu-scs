
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, DollarSign, Wallet, Activity, TrendingUp, History, Star, ArrowUpRight, BookOpen, AlertCircle, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

const Dashboard = ({ profile, isAdminActual, monitoredTeacher, year, semester }: any) => {
  const [stats, setStats] = useState<any>({
    studentsCount: 0, lessonsCount: 0, totalIncome: 0, pendingPayments: 0
  });
  const [yearlyStats, setYearlyStats] = useState<any>({
    totalIncome: 0, totalDebt: 0, semester1Income: 0, semester2Income: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isGlobalView = isAdminActual && !monitoredTeacher;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const teacherId = isGlobalView ? null : (monitoredTeacher?.id || profile?.id);

        // 1. جلب بيانات الفصل الحالي
        let qStds = supabase.from('student_summary_view').select('*');
        if (teacherId) qStds = qStds.eq('teacher_id', teacherId);
        const { data: stds } = await qStds;
        
        const currentTermStds = (stds || []).filter(s => s.academic_year === year && s.semester === semester);
        const hasNoTermStds = (stds || []).filter(s => !s.academic_year || !s.semester);
        const displayStds = currentTermStds.length > 0 ? currentTermStds : hasNoTermStds;

        // 2. جلب بيانات السنة كاملة للرسم البياني الإحصائي
        const yearStds = (stds || []).filter(s => s.academic_year === year);
        const s1Income = yearStds.filter(s => s.semester === '1').reduce((acc, c) => acc + Number(c.total_paid || 0), 0);
        const s2Income = yearStds.filter(s => s.semester === '2').reduce((acc, c) => acc + Number(c.total_paid || 0), 0);
        const yTotalIncome = yearStds.reduce((acc, c) => acc + Number(c.total_paid || 0), 0);
        const yTotalDebt = yearStds.reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0);

        setYearlyStats({
          totalIncome: yTotalIncome,
          totalDebt: yTotalDebt,
          semester1Income: s1Income,
          semester2Income: s2Income
        });

        // 3. الدروس والعمليات الأخيرة
        let qLss = supabase.from('lessons').select('id, created_at, academic_year, semester');
        if (teacherId) qLss = qLss.eq('teacher_id', teacherId);
        const { data: lss } = await qLss;

        let qPay = supabase.from('payments').select('amount, payment_date, students!inner(name, academic_year, semester)');
        if (teacherId) qPay = qPay.eq('teacher_id', teacherId);
        const { data: pays } = await qPay.order('payment_date', { ascending: false }).limit(6);

        setRecentActivities(pays || []);
        setStats({
          studentsCount: displayStds.length,
          lessonsCount: lss?.length || 0,
          totalIncome: displayStds.reduce((acc, c) => acc + Number(c.total_paid || 0), 0),
          pendingPayments: displayStds.reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0),
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher, year, semester]);

  const yearlyComparisonData = useMemo(() => [
    { name: 'بداية السنة', value: 0 },
    { name: 'الفصل الأول', value: yearlyStats.semester1Income },
    { name: 'الفصل الثاني', value: yearlyStats.semester2Income },
  ], [yearlyStats]);

  const financialData = useMemo(() => [
    { name: 'المحصل (فصلي)', value: stats.totalIncome, color: '#4f46e5' },
    { name: 'الديون (فصلية)', value: stats.pendingPayments, color: '#f43f5e' }
  ], [stats]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-indigo-600 text-xs uppercase tracking-widest">جاري تحليل البيانات المالية السنوية...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* 1. Yearly Summary Header (The Shield) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 relative overflow-hidden bg-slate-900 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl border border-white/5">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
               <div className="text-center md:text-right space-y-4">
                  <div className="inline-flex items-center gap-3 bg-indigo-500/20 px-6 py-2 rounded-full border border-indigo-500/30">
                     <Star size={16} className="text-amber-400" fill="currentColor" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">المركز السنوي: {year}</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter">كشف السنة الدراسية</h1>
                  <p className="text-slate-400 font-bold text-lg max-w-xl">عرض تجميعي لكافة التحصيلات والديون طوال العام الدراسي الحالي.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="text-center">
                     <p className="text-4xl font-black text-emerald-400">${yearlyStats.totalIncome.toLocaleString()}</p>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">محصل السـنة</p>
                  </div>
                  <div className="text-center">
                     <p className="text-4xl font-black text-rose-400">${yearlyStats.totalDebt.toLocaleString()}</p>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">ديون السـنة</p>
                  </div>
               </div>
            </div>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full"></div>
         </div>

         {/* Achievement Progress Card */}
         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="relative z-10 space-y-4">
               <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-900">تقدم الإنجاز السنوي</h3>
               <p className="text-5xl font-black text-indigo-600">
                  {Math.round((yearlyStats.totalIncome / (yearlyStats.totalIncome + yearlyStats.totalDebt || 1)) * 100)}%
               </p>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${(yearlyStats.totalIncome / (yearlyStats.totalIncome + yearlyStats.totalDebt || 1)) * 100}%` }}></div>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نسبة السيولة المحصلة للسنة</p>
            </div>
         </div>
      </div>

      {/* 2. Yearly Growth Chart Section */}
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col overflow-hidden group">
         <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-6">
               <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100"><BarChart3 size={24} /></div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900">تحليل الأداء المالي السنوي</h3>
                  <p className="text-xs font-bold text-slate-400">مقارنة التدفق النقدي بين الفصول الدراسية للسنة الحالية</p>
               </div>
            </div>
            <div className="hidden md:flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-700">الفصل الأول</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-700">الفصل الثاني</span>
               </div>
            </div>
         </div>
         
         <div className="h-[400px] w-full pr-10">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={yearlyComparisonData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 900, fontSize: 12, fill: '#94a3b8'}} dy={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 900, fontSize: 12, fill: '#94a3b8'}} dx={-10} />
                  <Tooltip 
                    contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}}
                    cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" animationDuration={2000} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 3. Global Stats Grids (Current Context) */}
      <div className="flex items-center gap-4 mb-2">
         <div className="bg-indigo-50 px-4 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">سياق الفصل الحالي</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب النشطون" value={stats.studentsCount} icon={<Users />} color="indigo" />
        <StatCard label="الحصص المنجزة" value={stats.lessonsCount} icon={<BookOpen />} color="blue" />
        <StatCard label="تحصيل الفصل" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign />} color="emerald" />
        <StatCard label="ديون الفصل" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<Wallet />} color="rose" />
      </div>

      {/* 4. Lower Analytics & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col overflow-hidden group">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">توازن السيولة الفصلي</h3>
                  <p className="text-xs font-bold text-slate-400">تحليل السيولة المتاحة مقابل الديون للفصل الحالي</p>
               </div>
               <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shadow-inner group-hover:rotate-12 transition-transform"><TrendingUp size={24} /></div>
            </div>
            
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} barSize={100}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 900, fontSize: 14, fill: '#94a3b8'}} />
                     <Tooltip cursor={{fill: '#f1f5f9', radius: 25}} contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                     <Bar dataKey="value" radius={[40, 40, 40, 40]}>
                        {financialData.map((e, i) => <Cell key={i} fill={e.color} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4"><History className="text-indigo-600" /> العمليات المالية الأخيرة</h3>
            <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar pr-2">
               {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-[10px] shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                        ${act.amount}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate leading-tight mb-1">{act.students?.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{act.payment_date}</p>
                     </div>
                     <ArrowUpRight size={16} className="text-emerald-500" />
                  </div>
               )) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-200">
                     <Activity size={48} className="mb-4 opacity-20" />
                     <p className="font-black text-xs">لا عمليات مالية مسجلة</p>
                  </div>
               )}
            </div>
            
            <button 
               onClick={() => window.location.hash = '#/payments'}
               className="mt-8 w-full py-5 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3"
            >
               الدخول للمركز المالي الكامل <ArrowUpRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => {
   const colors: any = {
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100'
   };
   return (
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
         <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
            {React.cloneElement(icon, { size: 28 })}
         </div>
         <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
         </div>
         <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${colors[color]} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-all`}></div>
      </div>
   );
};

export default Dashboard;
