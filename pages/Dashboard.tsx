
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, Activity, TrendingUp, History, Star, ArrowUpRight, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

        let qStds = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
        if (teacherId) qStds = qStds.eq('teacher_id', teacherId);
        const { data: stds } = await qStds;

        let qLss = supabase.from('lessons').select('id, created_at, academic_year, semester');
        // ملاحظة: قد تحتاج لفلترة الحصص أيضاً بناءً على السنة إذا كانت مرتبطة بالطالب
        if (teacherId) qLss = qLss.eq('teacher_id', teacherId);
        const { data: lss } = await qLss;

        let qPay = supabase.from('payments').select('amount, payment_date, students(name, academic_year, semester)');
        if (teacherId) qPay = qPay.eq('teacher_id', teacherId);
        const { data: pays } = await qPay.order('payment_date', { ascending: false }).limit(5);

        setRecentActivities(pays || []);
        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0, // هنا يمكن تعقيد الفلترة أكثر
          totalIncome: stds?.reduce((acc, c) => acc + Number(c.total_paid || 0), 0) || 0,
          pendingPayments: stds?.reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0) || 0,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher, year, semester]);

  const financialData = useMemo(() => [
    { name: 'محصل', value: stats.totalIncome, color: '#4f46e5' },
    { name: 'متبقي', value: stats.pendingPayments, color: '#f43f5e' }
  ], [stats]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-indigo-600 text-xs">جاري تحليل الفترة الدراسية {year}...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-diamond">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-slate-900 p-12 md:p-16 rounded-[4rem] text-white shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-right space-y-4">
               <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/10">
                  <Star size={16} className="text-amber-400" fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest">{year} | الفصل {semester}</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black tracking-tighter">مرحباً، {profile?.full_name.split(' ')[0]}</h1>
               <p className="text-slate-400 font-bold text-lg max-w-xl">إليك تقرير الفترة الحالية. النظام يعمل بمحرك القمة الماسي الجديد.</p>
            </div>
            
            <div className="flex gap-6">
               <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl shadow-indigo-600/30">
                     <Users size={32} />
                  </div>
                  <p className="text-3xl font-black">{stats.studentsCount}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">طالب مقيد</p>
               </div>
               <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl shadow-emerald-600/30">
                     <TrendingUp size={32} />
                  </div>
                  <p className="text-3xl font-black">${stats.totalIncome.toLocaleString()}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase">إيرادات الفترة</p>
               </div>
            </div>
         </div>
         <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="عدد الطلاب" value={stats.studentsCount} icon={<Users />} color="indigo" />
        <StatCard label="الحصص المسجلة" value={stats.lessonsCount} icon={<BookOpen />} color="blue" />
        <StatCard label="إجمالي التحصيل" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign />} color="emerald" />
        <StatCard label="ديون معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<Wallet />} color="rose" />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex justify-between items-center">
               التدفق النقدي للفترة
               <span className="text-xs font-black text-slate-400">الفصل {semester}</span>
            </h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData} barSize={80}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'Cairo', fontWeight: 900, fontSize: 14}} />
                     <Tooltip contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                     <Bar dataKey="value" radius={[30, 30, 30, 30]}>
                        {financialData.map((e, i) => <Cell key={i} fill={e.color} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[4rem] border shadow-sm flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4"><History className="text-indigo-600" /> آخر العمليات</h3>
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
               {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] hover:bg-white border border-transparent hover:border-indigo-100 transition-all">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-100">
                        ${act.amount}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{act.students?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{act.payment_date}</p>
                     </div>
                     <ArrowUpRight size={16} className="text-emerald-500" />
                  </div>
               )) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
                     <Activity size={48} className="mb-4" />
                     <p className="font-black text-xs">لا عمليات حديثة</p>
                  </div>
               )}
            </div>
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
      <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group overflow-hidden relative">
         <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { size: 28 })}
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
         <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${colors[color]} opacity-10 rounded-full blur-2xl`}></div>
      </div>
   );
};

export default Dashboard;
