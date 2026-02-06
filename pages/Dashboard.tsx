import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, GraduationCap, 
  Sun, Moon, Coffee, RefreshCw, Award, CreditCard, 
  Activity, ShieldCheck, Sparkles, Zap, ZapOff, BellRing, ChevronLeft,
  LineChart, History as LucideHistory
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
    if (hour < 12) return { text: isAdmin ? 'صباح السيادة، سيادة المدير' : 'يومك سعيد، أستاذنا', icon: <Coffee className="text-amber-500"/> };
    if (hour < 18) return { text: isAdmin ? 'تحية إنجاز، سيادة المدير' : 'تحية إنجاز، أستاذ', icon: <Sun className="text-orange-500"/> };
    return { text: isAdmin ? 'ليلة هادئة، سيادة المدير' : 'ليلة هادئة، أستاذ', icon: <Moon className="text-indigo-400"/> };
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      const { data: stdData } = await query;
      
      const totals = (stdData || []).reduce((acc, curr) => ({
        students: acc.students + 1,
        lessons: acc.lessons + Number(curr.total_lessons || 0),
        hours: acc.hours + Number(curr.total_hours || 0),
        income: acc.income + Number(curr.total_paid || 0),
        debts: acc.debts + Math.max(0, Number(curr.remaining_balance || 0)),
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
           const collected = tStds.reduce((sum, s) => sum + Number(s.total_paid || 0), 0);
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

      const { data: reqData } = await supabase.from('parent_requests').select('*, students(name, teacher_id)').eq('status', 'pending');
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
      <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 font-['Cairo'] pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className={`lg:col-span-3 ${isAdmin ? 'bg-slate-900' : 'bg-indigo-900'} p-12 lg:p-20 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border border-white/5`}>
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <span className="bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  {isAdmin ? <ShieldCheck size={18} className="text-emerald-400" /> : <Sparkles size={18} className="text-amber-400" />}
                  مركز القمة الرقمي
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter flex items-center gap-6">
                {greeting.text} {greeting.icon}
              </h1>
              <p className="text-white/60 font-bold text-xl max-w-2xl">
                {isAdmin ? 'مراقبة مركزية شاملة لكافة العمليات التعليمية والمالية.' : 'أنت تصنع المستقبل الآن. إليك نظرة سريعة على إنجازاتك اليوم.'}
              </p>
           </div>
           <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col justify-between group">
           <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform">
             <BellRing size={32} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">تنبيهات معلقة</p>
              <h2 className="text-4xl font-black text-slate-900">{pendingRequests.length}</h2>
              <p className="text-sm font-bold text-slate-500 mt-2">طلبات بانتظار الرد</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
         <StatTile label="إجمالي الطلاب" value={stats.totalStudents} sub="طالب نشط" icon={<Users size={24}/>} color="bg-indigo-600" />
         <StatTile label="الحصص المنفذة" value={stats.totalLessons} sub="حصة ناجحة" icon={<Calendar size={24}/>} color="bg-blue-600" />
         <StatTile label="المحصل المالي" value={`$${stats.totalIncome}`} sub="إيراد تراكمي" icon={<DollarSign size={24}/>} color="bg-emerald-600" />
         <StatTile label="ديون الطلاب" value={`$${stats.pendingPayments}`} sub="مستحقات جارية" icon={<CreditCard size={24}/>} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-12 lg:p-16 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden group">
           <div className="flex justify-between items-center mb-16">
              <div>
                 <h3 className="text-3xl font-black text-slate-900">معدل الإنتاجية التدريسية</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase mt-2">تحليل ساعات العمل لآخر 10 حصص</p>
              </div>
              <Activity className="text-indigo-600" size={32} />
           </div>
           <div className="h-[350px]">
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
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo'}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={5} fill="url(#colorVal)" dot={{r: 5, fill: '#4f46e5'}} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {isAdmin ? (
          <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col">
             <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Award size={28} className="text-amber-400"/> نخبة المعلمين</h3>
             <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                {teacherRankings.map((t, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black">{i+1}</div>
                        <p className="font-black">{t.name}</p>
                     </div>
                     <p className="text-xl font-black text-emerald-400 leading-none">${t.collected}</p>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col">
             <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Clock size={28} className="text-indigo-400"/> جدول الحصص اليوم</h3>
             <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                {todaySchedule.length > 0 ? todaySchedule.map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black">
                          <span className="text-sm leading-none">{s.start_time.split(':')[0]}</span>
                        </div>
                        <p className="font-black truncate max-w-[120px]">{s.students?.name}</p>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                    {/* Added ZapOff to fix 'Cannot find name ZapOff' */}
                    <ZapOff className="w-12 h-12" />
                    <p className="text-sm font-black">لا توجد حصص اليوم</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl">
           <div className="flex items-center gap-4 mb-10">
              <LucideHistory size={28} className="text-indigo-600" />
              <h3 className="text-2xl font-black text-slate-900">أحدث العمليات المالية</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {recentActions.map((action, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white transition-all">
                   <p className="text-[10px] font-black text-slate-400 mb-2">{new Date(action.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
                   <p className="font-black text-slate-900 mb-2 truncate">{action.students?.name}</p>
                   <span className="text-2xl font-black text-emerald-600">${action.amount}</span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const StatTile = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
    <div className={`${color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white mb-8 group-hover:rotate-12 transition-transform shadow-2xl relative z-10`}>
       {icon}
    </div>
    <div className="relative z-10">
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 mb-2 leading-none">{value}</h4>
       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sub}</p>
    </div>
  </div>
);

export default Dashboard;