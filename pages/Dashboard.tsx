
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, DollarSign, Wallet, Activity, TrendingUp, History, Star, ArrowUpRight, BookOpen, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

const Dashboard = ({ profile, isAdminActual, monitoredTeacher, year, semester }: any) => {
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
        
        // Logical Fallback: If filtered view returns nothing, check all records for this teacher
        const currentTermStds = (stds || []).filter(s => s.academic_year === year && s.semester === semester);
        const hasNoTermStds = (stds || []).filter(s => !s.academic_year || !s.semester);
        
        const displayStds = currentTermStds.length > 0 ? currentTermStds : hasNoTermStds;

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

  const financialData = useMemo(() => [
    { name: 'المحصل الفعلي', value: stats.totalIncome, color: '#4f46e5' },
    { name: 'الديون المتبقية', value: stats.pendingPayments, color: '#f43f5e' }
  ], [stats]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-indigo-600 text-xs">جاري استدعاء البيانات المالية...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Dynamic Finance Banner */}
      <div className="relative overflow-hidden bg-slate-900 p-10 md:p-16 rounded-[4rem] text-white shadow-2xl border border-white/5">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-right space-y-3">
               <div className="inline-flex items-center gap-3 bg-indigo-500/20 px-6 py-2 rounded-full border border-indigo-500/30">
                  <Star size={16} className="text-amber-400" fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">المركز المالي الماسي</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black tracking-tighter">الحالة المالية</h1>
               <p className="text-slate-400 font-bold text-lg max-w-xl">متابعة دقيقة للدخل والمديونية للفترة {year}</p>
            </div>
            
            <div className="flex gap-4 md:gap-8">
               <div className="text-center group">
                  <div className="w-20 h-20 bg-emerald-600/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-all duration-500">
                     <TrendingUp size={32} className="text-emerald-400 group-hover:text-white" />
                  </div>
                  <p className="text-3xl font-black">${stats.totalIncome.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي المحصل</p>
               </div>
               <div className="text-center group">
                  <div className="w-20 h-20 bg-rose-600/20 border border-rose-500/30 rounded-3xl flex items-center justify-center mb-4 group-hover:bg-rose-600 transition-all duration-500">
                     <AlertCircle size={32} className="text-rose-400 group-hover:text-white" />
                  </div>
                  <p className="text-3xl font-black text-rose-400">${stats.pendingPayments.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ديون نشطة</p>
               </div>
            </div>
         </div>
         <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
         <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Main Stats Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب النشطون" value={stats.studentsCount} icon={<Users />} color="indigo" />
        <StatCard label="الحصص المنجزة" value={stats.lessonsCount} icon={<BookOpen />} color="blue" />
        <StatCard label="التحصيل المالي" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign />} color="emerald" />
        <StatCard label="المديونية" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<Wallet />} color="rose" />
      </div>

      {/* Analytics Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border shadow-sm flex flex-col overflow-hidden group">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">تحليل الملاءة المالية</h3>
                  <p className="text-xs font-bold text-slate-400">مقارنة السيولة المتوفرة بالديون المستحقة</p>
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
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4"><History className="text-indigo-600" /> العمليات المالية</h3>
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
