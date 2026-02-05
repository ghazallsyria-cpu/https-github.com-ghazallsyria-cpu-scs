
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Sun, Moon, Coffee, RefreshCw, TrendingUp, Award, CreditCard, 
  Activity, PieChart, ShieldCheck, Sparkles, Zap, Bell, BellOff, BellRing
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: any) => {
  const [stats, setStats] = useState({ totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  const isAdmin = role === 'admin';
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'يومك سعيد، أستاذنا', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: 'تحية إنجاز، أستاذ', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: 'ليلة هادئة، أستاذ', icon: <Moon className="text-indigo-400 animate-pulse"/> };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      const { data: stdData } = await query;
      const totals = (stdData || []).reduce((acc, curr) => ({
        students: acc.students + 1,
        lessons: acc.lessons + (curr.total_lessons || 0),
        hours: acc.hours + (curr.total_hours || 0),
        income: acc.income + (curr.total_paid || 0),
        debts: acc.debts + Math.max(0, curr.remaining_balance || 0),
        completed: acc.completed + (curr.is_completed ? 1 : 0)
      }), { students: 0, lessons: 0, hours: 0, income: 0, debts: 0, completed: 0 });

      setStats({ totalStudents: totals.students, totalLessons: totals.lessons, totalHours: totals.hours, totalIncome: totals.income, pendingPayments: totals.debts, completedStudents: totals.completed });

      const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const today = DAYS[new Date().getDay()];
      let qSched = supabase.from('schedules').select('*, students(name)').eq('day_of_week', today);
      if (!isAdmin) qSched = qSched.eq('teacher_id', uid);
      const { data: schedData } = await qSched.order('start_time');
      setTodaySchedule(schedData || []);

      let lQuery = supabase.from('lessons').select('lesson_date, hours').order('lesson_date', { ascending: false }).limit(20);
      if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
      const { data: lsns } = await lQuery;
      const grouped = (lsns || []).reverse().reduce((acc: any, curr) => {
        const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + Number(curr.hours);
        return acc;
      }, {});
      setChartData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [year, semester, uid]);
  const collectionRate = Math.round((stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100);

  if (loading) return (
    <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 text-right">
      
      {/* MODERN BENTO HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 bg-gradient-to-br from-[#1E1B4B] via-[#2A266F] to-[#1E1B4B] p-12 lg:p-20 rounded-[5rem] text-white shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-center border border-white/5 group">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 group-hover:opacity-20 transition-opacity"></div>
           <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-[120px] animate-pulse"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-5 mb-14">
                <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                  <Sparkles size={20} className="text-amber-400" /> الذكاء الإحصائي للقمة
                </span>
              </div>
              <div className="flex items-center gap-10 mb-10">
                <div className="transform hover:rotate-12 transition-transform duration-700 cursor-default">{greeting.icon}</div>
                <h1 className="text-5xl lg:text-8xl font-black leading-tight tracking-tighter drop-shadow-2xl">{greeting.text}</h1>
              </div>
              <p className="text-indigo-100/60 font-black max-w-2xl text-xl lg:text-3xl leading-relaxed">أنت الآن تدير مستقبلاً تعليمياً. إليك أحدث الأرقام لمنصتك.</p>
           </div>
           <Zap className="absolute bottom-[-150px] left-[-150px] text-white/[0.04] w-[800px] h-[800px] -rotate-12 group-hover:rotate-0 transition-transform duration-[3s]" />
        </div>

        <div className="lg:col-span-1 bg-white p-14 rounded-[5rem] border border-slate-100 shadow-xl flex flex-col justify-between group hover:-translate-y-4 transition-all duration-1000 relative overflow-hidden">
           <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="bg-indigo-600 text-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-12 transition-all relative z-10">
             <BellRing size={48} />
           </div>
           <div className="relative z-10 mt-10">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-4">النظام التفاعلي</p>
              <h2 className="text-3xl font-black text-slate-900 mb-6">الإشعارات الذكية مفعلة</h2>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">سنقوم بتذكيرك بكافة المواعيد والمدفوعات المتأخرة فوراً.</p>
           </div>
        </div>
      </div>

      {/* STATS TILES - FLOATING STYLE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
         <StatTile label="الطلاب النشطون" value={stats.totalStudents} sub={`${stats.completedStudents} خريجون`} icon={<Users size={32}/>} color="bg-indigo-600 shadow-indigo-200" />
         <StatTile label="إنجاز الحصص" value={stats.totalLessons} sub="حصة مكتملة" icon={<Calendar size={32}/>} color="bg-blue-500 shadow-blue-200" />
         <StatTile label="وقت التدريس" value={stats.totalHours.toFixed(1)} sub="ساعة فعلية" icon={<Clock size={32}/>} color="bg-amber-500 shadow-amber-200" />
         <StatTile label="صافي الأرباح" value={`$${stats.totalIncome.toLocaleString()}`} sub={`${collectionRate}% محصل`} icon={<DollarSign size={32}/>} color="bg-emerald-500 shadow-emerald-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* PROGRESS CHART - GLASS STYLE */}
        <div className="lg:col-span-2 bg-white p-16 lg:p-20 rounded-[6rem] border border-slate-100 shadow-2xl relative group overflow-hidden">
           <div className="flex justify-between items-center mb-16 relative z-10">
              <div>
                 <h3 className="text-4xl font-black text-slate-900">مؤشر الكفاءة</h3>
                 <p className="text-[12px] text-slate-400 font-black uppercase mt-4 tracking-[0.3em]">تحليل الساعات التدريسية الأسبوعية</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2.5rem] text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-700">
                 <Activity size={40} />
              </div>
           </div>
           <div className="h-[450px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 900}} />
                    <Tooltip contentStyle={{borderRadius: '40px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900, padding: '30px'}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={8} fill="url(#colorVal)" dot={{r: 10, fill: '#fff', strokeWidth: 6, stroke: '#4f46e5'}} activeDot={{ r: 12, fill: '#4f46e5', strokeWidth: 0 }} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* AGENDA - DARK THEME STYLE */}
        <div className="bg-slate-900 p-16 rounded-[6rem] text-white shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col">
           <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="relative z-10 mb-14">
              <h3 className="text-4xl font-black mb-4 leading-tight">أجندة<br/><span className="text-indigo-400">اليوم المزدحم</span></h3>
              <p className="text-slate-400 text-sm font-bold">لديك {todaySchedule.length} مواعيد مجدولة لليوم.</p>
           </div>
           
           <div className="flex-1 space-y-6 relative z-10 overflow-y-auto no-scrollbar pr-2">
              {todaySchedule.length > 0 ? todaySchedule.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[3rem] hover:bg-white/10 transition-all group/card flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="bg-indigo-600 text-white w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black group-hover/card:scale-110 transition-transform shadow-xl">
                        <span className="text-xl">{s.start_time.split(':')[0]}</span>
                        <span className="text-[10px] opacity-60">:{s.start_time.split(':')[1]}</span>
                      </div>
                      <div>
                        <p className="text-lg font-black truncate max-w-[140px]">{s.students?.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest">{s.duration_hours} ساعة</p>
                      </div>
                   </div>
                   <ArrowUpRight size={24} className="text-indigo-400 group-hover/card:translate-x-2 group-hover/card:-translate-y-2 transition-transform" />
                </div>
              )) : (
                <div className="text-center py-20 opacity-30 italic font-black">لا توجد حصص مجدولة</div>
              )}
           </div>
           
           <button onClick={() => fetchData()} className="mt-10 bg-white/10 p-5 rounded-[2rem] font-black text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-3"><RefreshCw size={16}/> تحديث الأجندة</button>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-1000 group relative overflow-hidden">
    <div className={`${color} w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white mb-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shadow-2xl relative z-10`}>{icon}</div>
    <div className="relative z-10">
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{label}</p>
       <h4 className="text-5xl font-black text-slate-900 mb-3 leading-none tracking-tighter">{value}</h4>
       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sub}</p>
    </div>
    <div className="absolute -right-16 -bottom-16 w-48 h-48 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 text-slate-900">{icon}</div>
  </div>
);

export default Dashboard;
