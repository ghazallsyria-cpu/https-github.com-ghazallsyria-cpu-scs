import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp, BarChart3, ArrowUpRight, GraduationCap, Target, Zap } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, 
    totalLessons: 0, 
    totalHours: 0, 
    totalIncome: 0, 
    pendingPayments: 0,
    completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let query = supabase.from('student_summary_view')
          .select('total_lessons, total_hours, total_paid, expected_income, remaining_balance, is_completed')
          .eq('academic_year', year)
          .eq('semester', semester);
        
        if (!isAdmin) query = query.eq('teacher_id', uid);
        
        const { data: stdData, error } = await query;
        if (error) throw error;

        const totals = (stdData || []).reduce((acc, curr) => ({
          students: acc.students + 1,
          lessons: acc.lessons + curr.total_lessons,
          hours: acc.hours + curr.total_hours,
          income: acc.income + curr.total_paid,
          debts: acc.debts + Math.max(0, curr.remaining_balance),
          completed: acc.completed + (curr.is_completed ? 1 : 0)
        }), { students: 0, lessons: 0, hours: 0, income: 0, debts: 0, completed: 0 });

        setStats({
          totalStudents: totals.students,
          totalLessons: totals.lessons,
          totalHours: totals.hours,
          totalIncome: totals.income,
          pendingPayments: totals.debts,
          completedStudents: totals.completed
        });

        let lQuery = supabase.from('lessons')
          .select('lesson_date, hours')
          .order('lesson_date', { ascending: false })
          .limit(30);
        
        if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
        const { data: lsns } = await lQuery;

        const grouped = (lsns || []).reverse().reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});

        setChartData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })));

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, uid, year, semester, isAdmin]);

  const collectionRate = Math.round((stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100);

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 text-right font-['Cairo']">
      {/* Hero Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 rounded-[3.5rem] text-white shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">{year} | الفصل الدراسي {semester}</span>
              {stats.completedStudents === stats.totalStudents && stats.totalStudents > 0 && (
                 <span className="bg-emerald-400/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 px-5 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2">
                   <Target size={12}/> تم إنجاز الفترة بنجاح
                 </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.15]">نظرة عامة على<br/><span className="text-indigo-200">الأداء التعليمي</span></h1>
            <p className="text-indigo-100/70 font-bold max-w-lg text-lg leading-relaxed">أهلاً بك مجدداً. النظام يعمل بكفاءة عالية، تم تسجيل <span className="text-white underline decoration-wavy decoration-indigo-400">{stats.totalLessons}</span> حصة خلال الفترة الحالية.</p>
          </div>
          <GraduationCap className="absolute -bottom-10 -left-10 text-white/5 w-80 h-80 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col justify-between items-center text-center group hover:shadow-indigo-100 transition-all border-b-8 border-b-emerald-500">
          <div className="bg-emerald-50 text-emerald-600 p-8 rounded-[2.5rem] shadow-inner group-hover:scale-110 transition-transform duration-500">
             <DollarSign size={48} />
          </div>
          <div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">الدخل المحقق</p>
            <h2 className="text-5xl font-black text-slate-900 leading-none">${stats.totalIncome.toLocaleString()}</h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-xs bg-emerald-50 px-5 py-2.5 rounded-2xl">
            <Zap size={14} fill="currentColor"/> تحصيل ممتاز
          </div>
        </div>
      </div>
      
      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatBento label="إجمالي الطلاب" value={stats.totalStudents} sub={`${stats.completedStudents} منجز`} icon={<Users size={24}/>} color="bg-blue-600" />
        <StatBento label="إجمالي الساعات" value={stats.totalHours.toFixed(1)} sub="ساعة عمل" icon={<Clock size={24}/>} color="bg-amber-500" />
        <StatBento label="الحصص المنفذة" value={stats.totalLessons} sub="حصة دراسية" icon={<Calendar size={24}/>} color="bg-indigo-600" />
        <StatBento label="الديون المعلقة" value={`$${stats.pendingPayments.toLocaleString()}`} sub="غير محصلة" icon={<AlertCircle size={24}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">تحليل النشاط الزمني</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">معدل ساعات العمل اليومية</p>
            </div>
            <TrendingUp size={32} className="text-indigo-600" />
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '28px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontFamily: 'Cairo', fontWeight: 'bold', padding: '15px'}} 
                  cursor={{stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5'}}
                />
                {/* Fix: Remove invalid 'shadow' property from activeDot as it is not a valid SVG/Recharts property */}
                <Area type="monotone" dataKey="hours" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHours)" strokeWidth={6} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-white/5">
          <div className="absolute -top-20 -right-20 p-40 opacity-5 group-hover:rotate-45 transition-transform duration-1000">
            <BarChart3 size={300} />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-400 font-black uppercase text-[11px] tracking-[0.25em] mb-6">مؤشر التحصيل المالي</p>
            <div className="flex items-baseline gap-3 mb-4">
               <h2 className="text-7xl font-black text-white">{collectionRate}%</h2>
               <span className="text-emerald-400 font-bold text-lg flex items-center gap-1"><ArrowUpRight size={20}/></span>
            </div>
            <p className="text-slate-400 text-sm font-bold leading-relaxed">أداء مالي مستقر جداً، تم تحصيل معظم مستحقات الطلاب النشطين بنجاح.</p>
          </div>
          
          <div className="space-y-8 relative z-10 pt-12">
             <div className="w-full bg-white/5 h-8 rounded-full overflow-hidden p-2 border border-white/10">
               <div 
                 className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_30px_rgba(79,70,229,0.5)]" 
                 style={{ width: `${collectionRate}%` }}
               />
             </div>
             <div className="flex justify-between items-center">
                <div className="text-right">
                   <p className="text-[9px] text-slate-500 font-black uppercase mb-1">المتبقي</p>
                   <p className="text-rose-400 font-black text-xl">${stats.pendingPayments.toLocaleString()}</p>
                </div>
                <div className="text-left">
                   <p className="text-[9px] text-slate-500 font-black uppercase mb-1">المحصل</p>
                   <p className="text-emerald-400 font-black text-xl">${stats.totalIncome.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBento = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
    <div className={`${color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10 text-white shadow-lg`}>{icon}</div>
    <div className="relative z-10">
      <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900 mb-2">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{sub}</p>
    </div>
    <div className={`absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-700`}>{icon}</div>
  </div>
);

export default Dashboard;