import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Sun, Moon, Coffee, RefreshCw, TrendingUp, Award, CreditCard, 
  Activity, PieChart, ShieldCheck, Sparkles, Zap, Bell, BellOff, BellRing
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: any) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState<string>(Notification.permission);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  const isAdmin = role === 'admin';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'يومك سعيد يا أستاذ', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: 'يوم مليء بالإنجاز', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: 'ليلة هادئة ومثمرة', icon: <Moon className="text-indigo-400 animate-pulse"/> };
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        new Notification('نظام القمة التعليمي', {
          body: 'تم تفعيل التنبيهات الذكية بنجاح. سنذكرك بمواعيد حصصك القادمة.',
          icon: 'https://img.icons8.com/fluency/512/knowledge-sharing.png'
        });
      }
    } catch (e) {
      console.error('Error requesting notification permission', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب الإحصائيات المالية والطلاب
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

      // 2. جلب جدول اليوم للتنبيهات
      const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const today = DAYS[new Date().getDay()];
      let qSched = supabase.from('schedules').select('*, students(name)').eq('day_of_week', today);
      if (!isAdmin) qSched = qSched.eq('teacher_id', uid);
      const { data: schedData } = await qSched.order('start_time');
      setTodaySchedule(schedData || []);

      // 3. بيانات الرسم البياني
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
    <div className="h-96 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-right">
      
      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Hero Card */}
        <div className="lg:col-span-3 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] p-12 lg:p-20 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[450px] border border-white/5">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-12">
                <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                  <Sparkles size={18} className="text-amber-400" /> الحالة الرقمية للمنصة
                </span>
              </div>
              <div className="flex items-center gap-8 mb-10">
                <span className="text-6xl lg:text-8xl transform hover:scale-110 transition-transform duration-500 cursor-default">{greeting.icon}</span>
                <h1 className="text-4xl lg:text-7xl font-black leading-tight tracking-tighter">{greeting.text}</h1>
              </div>
              <p className="text-indigo-100/60 font-black max-w-2xl text-xl lg:text-2xl leading-relaxed">
                مرحباً بك مجدداً. إليك لمحة شاملة عن إحصائياتك للفصل الدراسي {semester} لعام {year}.
              </p>
           </div>
           <Zap className="absolute bottom-[-100px] left-[-100px] text-white/[0.03] w-[600px] h-[600px] -rotate-12" />
        </div>

        {/* Notifications Activation Bento */}
        <div className={`p-14 rounded-[4.5rem] border flex flex-col justify-between group overflow-hidden relative transition-all duration-700 hover:shadow-2xl ${notifPermission === 'granted' ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}>
           <div className={`bg-gradient-to-tr ${notifPermission === 'granted' ? 'from-indigo-600 to-indigo-400' : 'from-slate-400 to-slate-300'} text-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 relative z-10`}>
             {notifPermission === 'granted' ? <BellRing size={48} className="animate-pulse" /> : <BellOff size={48}/>}
           </div>
           <div className="relative z-10">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">نظام التذكير الذكي</p>
              {notifPermission === 'granted' ? (
                <>
                  <h2 className="text-2xl font-black text-indigo-900 leading-tight mb-4">التنبيهات مفعلة بنجاح</h2>
                  <p className="text-xs text-indigo-400 font-bold">سنقوم بإخطارك قبل بداية كل حصة بـ 15 دقيقة.</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-slate-800 leading-tight mb-6">فعل التنبيهات لضمان التواجد</h2>
                  <button onClick={requestNotificationPermission} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">تفعيل الآن</button>
                </>
              )}
           </div>
        </div>

      </div>

      {/* Today's Agenda Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
              <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl"><Clock size={24}/></div>
              <h3 className="font-black text-slate-900 text-xl">أجندة اليوم</h3>
           </div>
           <div className="space-y-6">
              {todaySchedule.length > 0 ? todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-default group">
                   <div className="text-center bg-slate-100 px-3 py-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <p className="text-[10px] font-black leading-none">{s.start_time.split(':')[0]}</p>
                      <p className="text-[8px] font-bold">:{s.start_time.split(':')[1]}</p>
                   </div>
                   <div className="overflow-hidden">
                      <p className="font-black text-slate-800 text-sm truncate">{s.students?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{s.duration_hours} ساعة</p>
                   </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 font-black italic">لا توجد حصص مجدولة لليوم.</p>
              )}
           </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-8">
           <StatBento label="إجمالي الطلاب" value={stats.totalStudents} sub={`${stats.completedStudents} منتهٍ`} icon={<Users size={32}/>} color="bg-indigo-600 shadow-indigo-100" />
           <StatBento label="حصص منفذة" value={stats.totalLessons} sub="حصة تعليمية" icon={<Calendar size={32}/>} color="bg-blue-500 shadow-blue-100" />
           <StatBento label="ساعات التدريس" value={stats.totalHours.toFixed(1)} sub="ساعة فعلية" icon={<Clock size={32}/>} color="bg-amber-500 shadow-amber-100" />
           <StatBento label="مستحقات معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} sub="ديون طلاب" icon={<CreditCard size={32}/>} color="bg-rose-500 shadow-rose-100" />
           
           {/* Financial Summary Bento */}
           <div className="col-span-2 bg-white p-14 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center group overflow-hidden relative">
              <div className="relative z-10 flex items-center gap-10">
                 <div className="bg-emerald-500 text-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <DollarSign size={48}/>
                 </div>
                 <div>
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">صافي التحصيل المالي</p>
                    <h2 className="text-5xl lg:text-6xl font-black text-slate-900 leading-none mb-4 tracking-tighter">${stats.totalIncome.toLocaleString()}</h2>
                    <div className="flex items-center gap-4 text-emerald-600 font-black text-[11px] bg-emerald-50 px-6 py-2 rounded-full w-fit">
                      <TrendingUp size={16} /> {collectionRate}% محصل
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Productivity Chart Area */}
        <div className="lg:col-span-2 bg-white p-14 lg:p-16 rounded-[5rem] border border-slate-100 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-1000">
           <div className="flex justify-between items-center mb-16">
              <div>
                 <h3 className="text-4xl font-black text-slate-900 leading-none">مؤشر الأداء</h3>
                 <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">تحليل الكفاءة التعليمية خلال الفترة الماضية</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-[2.5rem] text-indigo-600 shadow-inner group transition-transform"><Activity size={40} className="group-hover:scale-110 transition-transform"/></div>
           </div>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                    <Tooltip contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.12)', fontFamily: 'Cairo', fontWeight: 900, padding: '25px', backgroundColor: 'rgba(255,255,255,0.95)'}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={7} fill="url(#colorHours)" dot={{r: 8, fill: '#fff', strokeWidth: 5, stroke: '#4f46e5'}} activeDot={{ r: 10, fill: '#4f46e5', strokeWidth: 0 }} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Info Bento */}
        <div className="bg-slate-900 p-16 rounded-[5rem] text-white shadow-[0_40px_100px_-20px_rgba(15,23,42,0.5)] flex flex-col justify-between relative overflow-hidden group border border-white/5">
           <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="relative z-10">
              <h3 className="text-4xl font-black mb-10 leading-tight">جاهز للحصة <br/>القادمة؟</h3>
              <p className="text-slate-400 font-black leading-relaxed mb-16 text-xl">
                لقد قمت بإنجاز {stats.totalLessons} حصة هذا الفصل. نظام التذكير الذكي سيضمن عدم فوات أي موعد.
              </p>
              <div className="space-y-6">
                 <div className="flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl hover:bg-white/10 transition-all cursor-default">
                    <div className="bg-indigo-600/40 p-4 rounded-2xl text-white shadow-lg"><Award size={28}/></div>
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-300">أداء فصلي قياسي</p>
                 </div>
                 <div className="flex items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl hover:bg-white/10 transition-all cursor-default">
                    <div className="bg-emerald-600/40 p-4 rounded-2xl text-white shadow-lg"><ShieldCheck size={28}/></div>
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-300">نظام مشفر بالكامل</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const StatBento = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-1000 group relative overflow-hidden text-right">
    <div className={`${color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white mb-8 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shadow-xl relative z-10`}>{icon}</div>
    <div className="relative z-10">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 mb-2 leading-none tracking-tighter">{value}</h4>
       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{sub}</p>
    </div>
  </div>
);

export default Dashboard;