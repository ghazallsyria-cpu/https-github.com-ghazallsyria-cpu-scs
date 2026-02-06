import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, RefreshCw, 
  Award, CreditCard, ShieldCheck, Sparkles, BellRing,
  History as LucideHistory, Sun, Moon, Coffee, ZapOff
} from 'lucide-react';

const Dashboard = ({ role, uid, year, semester }: any) => {
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalLessons: 0, 
    totalHours: 0, 
    totalIncome: 0, 
    pendingPayments: 0, 
    completedStudents: 0 
  });
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
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
      let stdQuery = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) stdQuery = stdQuery.eq('teacher_id', uid);
      const { data: stdData } = await stdQuery;

      let lsnQuery = supabase.from('lessons').select('*');
      if (!isAdmin) lsnQuery = lsnQuery.eq('teacher_id', uid);
      const { data: lsnData } = await lsnQuery;

      let payQuery = supabase.from('payments').select('*, students(name)');
      if (!isAdmin) payQuery = payQuery.eq('teacher_id', uid);
      const { data: payData } = await payQuery;

      const totalIncome = (payData || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const totalHours = (lsnData || []).reduce((sum, l) => sum + Number(l.hours), 0);
      const totalDebts = (stdData || []).reduce((sum, s) => sum + Math.max(0, Number(s.remaining_balance || 0)), 0);

      setStats({ 
        totalStudents: stdData?.length || 0, 
        totalLessons: lsnData?.length || 0, 
        totalHours: totalHours, 
        totalIncome: totalIncome, 
        pendingPayments: totalDebts, 
        completedStudents: stdData?.filter(s => s.is_completed).length || 0 
      });

      if (isAdmin) {
        setRecentActions((payData || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        const rankings = (teachers || []).map(t => {
           const collected = (payData || []).filter(p => p.teacher_id === t.id).reduce((sum, p) => sum + Number(p.amount), 0);
           return { name: t.full_name, collected };
        }).sort((a, b) => b.collected - a.collected).slice(0, 5);
        setTeacherRankings(rankings);
      } else {
        const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const today = DAYS[new Date().getDay()];
        const { data: schedData } = await supabase.from('schedules').select('*, students(name)').eq('day_of_week', today).eq('teacher_id', uid).order('start_time');
        setTodaySchedule(schedData || []);
      }
    } catch (e) { 
      console.error("Dashboard Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [year, semester, uid, role]);

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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي الطلاب</p>
              <h2 className="text-4xl font-black text-slate-900">{stats.totalStudents}</h2>
           </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
         <StatTile label="الطلاب" value={stats.totalStudents} sub="طالب نشط" icon={<Users size={24}/>} color="bg-indigo-600" />
         <StatTile label="الحصص" value={stats.totalLessons} sub="حصة ناجحة" icon={<Calendar size={24}/>} color="bg-blue-600" />
         <StatTile label="المحصل" value={`$${stats.totalIncome.toLocaleString()}`} sub="إيراد تراكمي" icon={<DollarSign size={24}/>} color="bg-emerald-600" />
         <StatTile label="الديون" value={`$${stats.pendingPayments.toLocaleString()}`} sub="مستحقات معلقة" icon={<CreditCard size={24}/>} color="bg-rose-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {isAdmin ? (
          <>
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl">
               <div className="flex items-center gap-4 mb-10">
                  <LucideHistory size={28} className="text-indigo-600" />
                  <h3 className="text-2xl font-black text-slate-900">أحدث العمليات المالية</h3>
               </div>
               <div className="space-y-4">
                  {recentActions.map((action, i) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <div>
                          <p className="font-black text-slate-900">{action.students?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(action.created_at).toLocaleDateString('ar-EG')}</p>
                       </div>
                       <span className="text-xl font-black text-emerald-600">${action.amount}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl">
               <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Award size={28} className="text-amber-400"/> نخبة المعلمين</h3>
               <div className="space-y-4">
                  {teacherRankings.map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-white/10 transition-all">
                       <p className="font-black">{t.name}</p>
                       <p className="text-xl font-black text-emerald-400">${t.collected.toLocaleString()}</p>
                    </div>
                  ))}
               </div>
            </div>
          </>
        ) : (
          <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl">
             <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Clock size={28} className="text-indigo-400"/> جدول الحصص اليوم</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todaySchedule.length > 0 ? todaySchedule.map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between">
                     <p className="font-black truncate">{s.students?.name}</p>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-20 opacity-30">
                    <ZapOff className="w-12 h-12 mx-auto" />
                    <p className="text-sm font-black mt-4">لا توجد حصص مجدولة</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all">
    <div className={`${color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white mb-8`}>{icon}</div>
    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <h4 className="text-4xl font-black text-slate-900 mb-2">{value}</h4>
    <p className="text-[10px] font-black text-slate-300">{sub}</p>
  </div>
);

export default Dashboard;