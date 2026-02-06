import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Sun, Moon, Coffee, RefreshCw, TrendingUp, Award, CreditCard, 
  Activity, PieChart, ShieldCheck, Sparkles, Zap, Bell, BellOff, BellRing, Heart, ChevronLeft,
  Briefcase, TrendingDown, Target, ZapOff, Users2, BarChart3, LineChart,
  History as LucideHistory
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: any) => {
  const [stats, setStats] = useState({ totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [teacherRankings, setTeacherRankings] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);

  const isAdmin = role === 'admin';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: isAdmin ? 'صباح السيادة، سيادة المدير' : 'يومك سعيد، أستاذنا', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: isAdmin ? 'تحية إنجاز، سيادة المدير' : 'تحية إنجاز، أستاذ', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: isAdmin ? 'ليلة هادئة، سيادة المدير' : 'ليلة هادئة، أستاذ', icon: <Moon className="text-indigo-400 animate-pulse"/> };
  }, [isAdmin]);

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

      setStats({ 
        totalStudents: totals.students, 
        totalLessons: totals.lessons, 
        totalHours: totals.hours, 
        totalIncome: totals.income, 
        pendingPayments: totals.debts, 
        completedStudents: totals.completed 
      });

      if (isAdmin) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        const rankings = (teachers || []).map(t => {
           const tStds = (stdData || []).filter(s => s.teacher_id === t.id);
           const collected = tStds.reduce((sum, s) => sum + (s.total_paid || 0), 0);
           return { name: t.full_name, collected };
        }).sort((a, b) => b.collected - a.collected).slice(0, 5);
        setTeacherRankings(rankings);

        const { data: logs } = await supabase.from('payments').select('*, students(name)').order('created_at', { ascending: false }).limit(5);
        setRecentActions(logs || []);
      } else {
        const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const today = DAYS[new Date().getDay()];
        const { data: schedData } = await supabase.from('schedules').select('*, students(name)').eq('day_of_week', today).eq('teacher_id', uid).order('start_time');
        setTodaySchedule(schedData || []);
      }

      let lQuery = supabase.from('lessons').select('lesson_date, hours').order('lesson_date', { ascending: false }).limit(50);
      if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
      const { data: lsns } = await lQuery;
      
      const grouped = (lsns || []).reverse().reduce((acc: any, curr) => {
        const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        acc[date] = (acc[date] || 0) + Number(curr.hours);
        return acc;
      }, {});
      
      setChartData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })).slice(-10));

      let qReq = supabase.from('parent_requests').select('*, students(name, teacher_id)').eq('status', 'pending');
      const { data: reqData } = await qReq;
      setPendingRequests(isAdmin ? (reqData || []) : (reqData || []).filter(r => r.students?.teacher_id === uid));

    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [year, semester, uid]);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 text-right font-['Cairo'] pb-32`}>
      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-10`}>
        <div className={`lg:col-span-3 ${isAdmin ? 'bg-slate-900 border-white/5' : 'bg-indigo-900 border-white/5'} p-12 lg:p-20 rounded-[5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border group`}>
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-5 mb-10">
                <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4">
                  {isAdmin ? <ShieldCheck size={20} className="text-emerald-400" /> : <Sparkles size={20} className="text-amber-400" />}
                  {isAdmin ? 'مركز الإدارة المركزية والرقابة' : 'نظام القمة التعليمي - حساب المعلم'}
                </span>
              </div>
              <h1 className="text-5xl lg:text-8xl font-black leading-tight tracking-tighter mb-8 drop-shadow-2xl">{greeting.text}</h1>
              <p className="text-indigo-100/50 font-black text-2xl lg:text-3xl max-w-2xl leading-relaxed">
                {isAdmin ? 'تتم مراقبة أداء المنصة المالي والتعليمي بالكامل في هذه اللحظة.' : 'أنت الآن تدير مستقبلاً تعليمياً. إليك أحدث الأرقام لمنصتك.'}
              </p>
           </div>
        </div>

        <div className={`lg:col-span-1 ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900'} p-12 rounded-[5rem] shadow-2xl flex flex-col justify-between group relative overflow-hidden border border-slate-100`}>
           <div className={`p-8 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 transition-transform group-hover:rotate-12 ${isAdmin ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
             {isAdmin ? <Activity size={48} /> : <BellRing size={48} />}
           </div>
           <div className="relative z-10 mt-10">
              <p className={`text-[12px] font-black uppercase tracking-widest mb-4 opacity-50`}>حالة الإشعارات</p>
              <h2 className="text-3xl font-black mb-6">طلبات معلقة</h2>
              <p className="text-sm font-bold leading-relaxed">لديك {pendingRequests.length} طلبات جديدة بانتظار الرد.</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
         <StatTile label={isAdmin ? "إجمالي الطلاب بالمنصة" : "طلابي"} value={stats.totalStudents} sub={`${stats.completedStudents} خريجون`} icon={<Users size={24}/>} color="bg-indigo-600" />
         <StatTile label={isAdmin ? "إجمالي الحصص المنفذة" : "حصصي"} value={stats.totalLessons} sub="إنجاز تراكمي" icon={<Calendar size={24}/>} color="bg-blue-600" />
         <StatTile label={isAdmin ? "إجمالي الدخل العام" : "محفظتي المالية"} value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي المحصل" icon={<DollarSign size={24}/>} color="bg-emerald-600" />
         <StatTile label={isAdmin ? "الديون الخارجية الكلية" : "ديون الطلاب المتبقية"} value={`$${stats.pendingPayments.toLocaleString()}`} sub="مطالبات جارية" icon={<CreditCard size={24}/>} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-12 lg:p-20 rounded-[5rem] border border-slate-100 shadow-2xl relative group">
           <div className="flex justify-between items-center mb-16">
              <div>
                 <h3 className="text-4xl font-black text-slate-900">{isAdmin ? 'معدل الإنتاجية التدريسية العام' : 'تحليل مجهودي الشخصي'}</h3>
                 <p className="text-slate-400 font-black text-sm uppercase mt-3 tracking-widest">تحليل الساعات المنجزة (آخر 10 أيام)</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-3xl text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                 <LineChart size={32} />
              </div>
           </div>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                    <Tooltip contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={5} fill="url(#colorVal)" dot={{r: 5, fill: '#fff', strokeWidth: 3, stroke: '#4f46e5'}} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {isAdmin ? (
          <div className="bg-slate-900 p-12 lg:p-16 rounded-[5rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/5"></div>
             <h3 className="text-3xl font-black mb-12 flex items-center gap-5 relative z-10"><Award size={36} className="text-amber-400"/> النخبة - الأفضل تحصيلاً</h3>
             <div className="space-y-6 flex-1 relative z-10 overflow-y-auto no-scrollbar">
                {teacherRankings.map((t, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[3rem] flex items-center justify-between hover:bg-white/10 transition-all group">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-2xl group-hover:scale-110 transition-transform">{i+1}</div>
                        <div>
                           <p className="text-xl font-black">{t.name}</p>
                           <p className="text-[10px] text-indigo-400 font-black mt-1 uppercase">معلم معتمد بالمنصة</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-black text-emerald-400 leading-none">${t.collected.toLocaleString()}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="bg-slate-900 p-12 lg:p-16 rounded-[5rem] text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
             <h3 className="text-3xl font-black mb-12 flex items-center gap-5 relative z-10"><Calendar size={32} className="text-indigo-400"/> أجندة حصصي اليوم</h3>
             <div className="space-y-4 flex-1 relative z-10 overflow-y-auto no-scrollbar pr-2">
                {todaySchedule.length > 0 ? todaySchedule.map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-[2.2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-5">
                        <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-xl shrink-0 group-hover:scale-105 transition-transform">
                          <span className="text-lg leading-none">{s.start_time.split(':')[0]}</span>
                        </div>
                        <div>
                          <p className="text-lg font-black truncate max-w-[150px]">{s.students?.name}</p>
                        </div>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                    <Clock size={48} />
                    <p className="text-sm font-black italic">لا توجد حصص مجدولة لليوم</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white p-12 lg:p-20 rounded-[5rem] border border-slate-100 shadow-2xl">
           <div className="flex items-center gap-6 mb-14">
              <div className="bg-emerald-50 p-5 rounded-3xl text-emerald-600 shadow-inner">
                <LucideHistory size={32} />
              </div>
              <div>
                 <h3 className="text-4xl font-black text-slate-900">سجل النشاط المالي الحي</h3>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {recentActions.map((action, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 hover:bg-white transition-all group">
                   <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">{new Date(action.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
                   <p className="text-xl font-black text-slate-900 mb-2 truncate">{action.students?.name}</p>
                   <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-emerald-600">${action.amount}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const StatTile = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-8 md:p-12 rounded-[3.5rem] md:rounded-[4.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 group relative overflow-hidden">
    <div className={`${color} w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center text-white mb-8 md:mb-12 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shadow-2xl relative z-10`}>
       {React.cloneElement(icon, { size: 24, className: 'md:w-10 md:h-10' })}
    </div>
    <div className="relative z-10">
       <p className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 md:mb-4">{label}</p>
       <h4 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter leading-none">{value}</h4>
       <div className="flex items-center gap-3">
          <p className="text-[9px] md:text-[11px] font-black text-slate-300 uppercase tracking-widest">{sub}</p>
       </div>
    </div>
  </div>
);

export default Dashboard;