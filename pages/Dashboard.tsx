
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, Activity, TrendingUp, ShieldCheck, ArrowUpRight, History, Star, TrendingDown, BookOpen
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
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
        const { data: pays } = await qPay.order('payment_date', { ascending: false }).limit(5);

        setRecentActivities(pays || []);
        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: stds?.reduce((acc, c) => acc + Number(c.total_paid || 0), 0) || 0,
          pendingPayments: stds?.reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0) || 0,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher]);

  const financialData = useMemo(() => [
    { name: 'محصل', value: stats.totalIncome, color: '#4f46e5' },
    { name: 'متبقي', value: stats.pendingPayments, color: '#f43f5e' }
  ], [stats]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-indigo-600 text-xs tracking-widest">توليد تقارير القمة...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Dynamic Welcome Card */}
      <div className="relative overflow-hidden bg-slate-900 p-12 md:p-20 rounded-[4rem] text-white shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-right space-y-4">
               <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-5 py-2 rounded-full text-indigo-300 font-black text-xs uppercase tracking-widest border border-indigo-500/30">
                  <Star size={14} fill="currentColor" /> الإصدار الماسي الجديد
               </div>
               <h1 className="text-4xl md:text-6xl font-black tracking-tighter">أهلاً بك، <span className="text-indigo-400">{profile?.full_name.split(' ')[0]}</span></h1>
               <p className="text-slate-400 font-bold text-lg max-w-xl">إليك التحليل الشامل لأدائك التعليمي والمالي. النظام الآن يعمل بأقصى طاقته الذكية.</p>
            </div>
            
            <div className="flex gap-6">
               <div className="text-center group">
                  <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mb-3 group-hover:bg-indigo-600 transition-all duration-500">
                     <Users size={32} className="text-indigo-400 group-hover:text-white" />
                  </div>
                  <p className="text-3xl font-black">{stats.studentsCount}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">طالب نشط</p>
               </div>
               <div className="text-center group">
                  <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mb-3 group-hover:bg-indigo-600 transition-all duration-500">
                     <BookOpen size={32} className="text-indigo-400 group-hover:text-white" />
                  </div>
                  <p className="text-3xl font-black">{stats.lessonsCount}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">حصة منجزة</p>
               </div>
            </div>
         </div>
         {/* Glow Backgrounds */}
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Hero Stats Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatItem label="السيولة المتوفرة" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign />} color="emerald" trend="+12%" />
        <StatItem label="المستحقات الخارجية" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<Wallet />} color="rose" trend="متابعة" />
        <StatItem label="كفاءة التحصيل" value="94%" icon={<TrendingUp />} color="indigo" trend="ممتاز" />
        <StatItem label="متوسط الحصص" value="4.2" icon={<Activity />} color="blue" trend="مستقر" />
      </div>

      {/* Analytics Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Visual Chart */}
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">التحليل المالي الذكي</h3>
                  <p className="text-xs font-bold text-slate-400">مقارنة السيولة بالمديونية للفصل الحالي</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl"><TrendingUp size={24} className="text-indigo-600" /></div>
            </div>
            
            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} barSize={80}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 900, fontSize: 14, fill: '#64748b'}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc', radius: 25}}
                        contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}}
                     />
                     <Bar dataKey="value" radius={[30, 30, 30, 30]}>
                        {financialData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Activity Pulse Feed */}
         <div className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4"><History className="text-indigo-600" /> نبض النشاط</h3>
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
               {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                  <div key={i} className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                     <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
                        ${act.amount}
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-black text-slate-900 leading-tight mb-1">{act.students?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{act.payment_date}</p>
                     </div>
                     <ArrowUpRight size={18} className="text-emerald-500" />
                  </div>
               )) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
                     <Zap size={48} className="mb-4" />
                     <p className="font-black">لا نشاط مالي حديث</p>
                  </div>
               )}
            </div>
            
            <button className="mt-8 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
               عرض كافة السجلات <ArrowUpRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon, color, trend }: any) => {
   const variants: any = {
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100'
   };
   return (
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
         <div className={`w-16 h-16 ${variants[color]} rounded-[1.8rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
            {React.cloneElement(icon, { size: 30 })}
         </div>
         <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{value}</h4>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${variants[color]}`}>{trend}</span>
         </div>
         {/* Decorative backgrounds */}
         <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${variants[color]} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all`}></div>
      </div>
   );
};

export default Dashboard;
