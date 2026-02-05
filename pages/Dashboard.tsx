
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Sun, Moon, Coffee, RefreshCw, TrendingUp, Award, CreditCard, 
  Activity, PieChart, ShieldCheck, Sparkles, Zap, Bell, BellOff, BellRing, Heart, ChevronLeft
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: any) => {
  const [stats, setStats] = useState({ totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

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

      // جلب الجدول والطلبات المعلقة
      const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const today = DAYS[new Date().getDay()];
      
      let qSched = supabase.from('schedules').select('*, students(name)').eq('day_of_week', today);
      if (!isAdmin) qSched = qSched.eq('teacher_id', uid);
      const { data: schedData } = await qSched.order('start_time');
      setTodaySchedule(schedData || []);

      // جلب طلبات أولياء الأمور
      let qReq = supabase.from('parent_requests').select('*, students(name, teacher_id)').eq('status', 'pending');
      const { data: reqData } = await qReq;
      setPendingRequests(isAdmin ? (reqData || []) : (reqData || []).filter(r => r.students?.teacher_id === uid));

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

  const handleHandleRequest = async (id: string, status: 'accepted' | 'rejected') => {
    await supabase.from('parent_requests').update({ status }).eq('id', id);
    fetchData();
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
  );

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 text-right">
      
      {/* BENTO HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
        <div className="lg:col-span-3 bg-gradient-to-br from-[#1E1B4B] via-[#2A266F] to-[#1E1B4B] p-8 md:p-12 lg:p-20 rounded-[2.5rem] md:rounded-[5rem] text-white shadow-2xl relative overflow-hidden min-h-[300px] md:min-h-[500px] flex flex-col justify-center border border-white/5 group">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 group-hover:opacity-20 transition-opacity"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 md:gap-5 mb-8 md:mb-14">
                <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-4 md:px-8 py-2 md:py-3 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3">
                  <Sparkles size={16} className="text-amber-400" /> الذكاء الإحصائي للقمة
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-10 mb-6 md:mb-10">
                <h1 className="text-3xl md:text-5xl lg:text-8xl font-black leading-tight tracking-tighter drop-shadow-2xl">{greeting.text}</h1>
              </div>
              <p className="text-indigo-100/60 font-black max-w-2xl text-base md:text-xl lg:text-3xl leading-relaxed">أنت الآن تدير مستقبلاً تعليمياً. إليك أحدث الأرقام لمنصتك.</p>
           </div>
        </div>

        <div className="lg:col-span-1 bg-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[5rem] border border-slate-100 shadow-xl flex flex-col justify-between group hover:-translate-y-2 transition-all duration-700 relative overflow-hidden">
           <div className="bg-indigo-600 text-white w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-12 transition-all relative z-10">
             <BellRing size={32} className="md:w-12 md:h-12" />
           </div>
           <div className="relative z-10 mt-6 md:mt-10">
              <p className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4">تنبيهات النظام</p>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 mb-4 md:mb-6">إشعارات القمة</h2>
              <p className="text-[10px] md:text-xs text-slate-400 font-bold leading-relaxed">لديك {pendingRequests.length} طلبات جديدة من أولياء الأمور بانتظار الرد.</p>
           </div>
        </div>
      </div>

      {/* PENDING REQUESTS SECTION (IF ANY) */}
      {pendingRequests.length > 0 && (
        <div className="bg-emerald-50 p-8 md:p-12 rounded-[3rem] border border-emerald-100 animate-in slide-in-from-right duration-700">
           <div className="flex items-center gap-4 mb-8">
              <Heart className="text-emerald-600 animate-pulse" />
              <h3 className="text-xl md:text-2xl font-black text-emerald-900">طلبات أولياء الأمور المعلقة</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-100 flex flex-col justify-between group hover:shadow-md transition-all">
                   <div>
                      <div className="flex justify-between items-start mb-4">
                         <span className={`text-[9px] font-black px-4 py-1.5 rounded-full ${req.type === 'apology' ? 'bg-rose-100 text-rose-600' : (req.type === 'payment_intent' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}`}>
                            {req.type === 'apology' ? 'اعتذار عن حصة' : (req.type === 'payment_intent' ? 'إشعار دفع' : 'ملاحظة خاصة')}
                         </span>
                         <span className="text-[9px] font-black text-slate-400">{new Date(req.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <p className="font-black text-slate-900 mb-2">الطالب: {req.students?.name}</p>
                      <p className="text-xs font-bold text-slate-500 mb-6 italic">"{req.content}" {req.amount ? `| المبلغ: $${req.amount}` : ''}</p>
                   </div>
                   <div className="flex gap-2 pt-4 border-t border-slate-50">
                      <button onClick={() => handleHandleRequest(req.id, 'accepted')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] hover:bg-emerald-700 active:scale-95 transition-all">قبول</button>
                      <button onClick={() => handleHandleRequest(req.id, 'rejected')} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] hover:bg-rose-50 hover:text-rose-500 active:scale-95 transition-all">رفض</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* STATS TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
         <StatTile label="الطلاب" value={stats.totalStudents} sub={`${stats.completedStudents} خريجون`} icon={<Users size={24}/>} color="bg-indigo-600 shadow-indigo-200" />
         <StatTile label="الحصص" value={stats.totalLessons} sub="حصة مكتملة" icon={<Calendar size={24}/>} color="bg-blue-500 shadow-blue-200" />
         <StatTile label="الساعات" value={stats.totalHours.toFixed(1)} sub="ساعة فعلية" icon={<Clock size={24}/>} color="bg-amber-500 shadow-amber-200" />
         <StatTile label="الأرباح" value={`$${stats.totalIncome.toLocaleString()}`} sub={`${Math.round((stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100)}% محصل`} icon={<DollarSign size={24}/>} color="bg-emerald-500 shadow-emerald-200" />
      </div>

      {/* CHARTS & AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
        <div className="lg:col-span-2 bg-white p-8 md:p-16 lg:p-20 rounded-[2.5rem] md:rounded-[6rem] border border-slate-100 shadow-2xl relative overflow-hidden">
           <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-10">تحليل كفاءة المجهود</h3>
           <div className="h-[250px] md:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={4} fill="url(#colorVal)" dot={{r: 4, fill: '#fff', strokeWidth: 3, stroke: '#4f46e5'}} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 p-8 md:p-16 rounded-[2.5rem] md:rounded-[6rem] text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">
           <h3 className="text-2xl md:text-4xl font-black mb-14 leading-tight">أجندة<br/><span className="text-indigo-400">اليوم</span></h3>
           <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-1">
              {todaySchedule.length > 0 ? todaySchedule.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] hover:bg-white/10 transition-all flex items-center justify-between">
                   <div className="flex items-center gap-4 md:gap-6">
                      <div className="bg-indigo-600 text-white w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center font-black shadow-xl shrink-0">
                        <span className="text-base md:text-xl">{s.start_time.split(':')[0]}</span>
                        <span className="text-[8px] md:text-[10px] opacity-60">:{s.start_time.split(':')[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm md:text-lg font-black truncate max-w-[120px]">{s.students?.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-1 tracking-widest">{s.duration_hours} ساعة</p>
                      </div>
                   </div>
                </div>
              )) : <div className="text-center py-10 opacity-30 italic font-black text-xs">لا توجد حصص مجدولة</div>}
           </div>
           <button onClick={() => fetchData()} className="mt-8 bg-white/10 p-4 rounded-[1.5rem] font-black text-[10px] hover:bg-white/20 transition-all flex items-center justify-center gap-3"><RefreshCw size={14}/> تحديث</button>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
    <div className={`${color} w-10 h-10 md:w-20 md:h-20 rounded-[1rem] md:rounded-[2.5rem] flex items-center justify-center text-white mb-6 md:mb-10 group-hover:rotate-12 transition-all shadow-2xl relative z-10`}>
       {React.cloneElement(icon, { size: 20, className: 'md:w-8 md:h-8' })}
    </div>
    <div className="relative z-10">
       <p className="text-[8px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1 md:mb-3">{label}</p>
       <h4 className="text-2xl md:text-5xl font-black text-slate-900 mb-1 md:mb-3 leading-none tracking-tighter">{value}</h4>
       <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{sub}</p>
    </div>
  </div>
);

export default Dashboard;
