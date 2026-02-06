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
      // 1. جلب ملخص الطلاب - محاولة جلبها من العرض أو الجدول مباشرة كاحتياط
      let query = supabase.from('students').select('*');
      if (!isAdmin) query = query.eq('teacher_id', uid);
      
      const { data: stdData, error: stdError } = await query;
      
      // جلب المدفوعات والحصص لحساب الإحصائيات يدوياً إذا لزم الأمر لضمان الدقة
      let pQuery = supabase.from('payments').select('amount, teacher_id');
      if (!isAdmin) pQuery = pQuery.eq('teacher_id', uid);
      const { data: payData } = await pQuery;

      let lQuery = supabase.from('lessons').select('hours, teacher_id');
      if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
      const { data: lessonData } = await lQuery;

      const totalIncome = (payData || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const totalHours = (lessonData || []).reduce((sum, l) => sum + Number(l.hours), 0);

      setStats({ 
        totalStudents: stdData?.length || 0, 
        totalLessons: lessonData?.length || 0, 
        totalHours: totalHours, 
        totalIncome: totalIncome, 
        pendingPayments: 0, // يمكن توسيعها لاحقاً
        completedStudents: stdData?.filter(s => s.is_completed).length || 0 
      });

      // 2. بيانات خاصة بالمدير
      if (isAdmin) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        const rankings = (teachers || []).map(t => {
           const collected = (payData || []).filter(p => p.teacher_id === t.id).reduce((sum, p) => sum + Number(p.amount), 0);
           return { name: t.full_name, collected };
        }).sort((a, b) => b.collected - a.collected).slice(0, 5);
        setTeacherRankings(rankings);

        const { data: logs } = await supabase.from('payments').select('*, students(name)').order('created_at', { ascending: false }).limit(5);
        setRecentActions(logs || []);
      }

      // 3. الجدول اليومي للمعلم
      if (!isAdmin) {
        const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const today = DAYS[new Date().getDay()];
        const { data: schedData } = await supabase.from('schedules').select('*, students(name)').eq('day_of_week', today).eq('teacher_id', uid).order('start_time');
        setTodaySchedule(schedData || []);
      }

    } catch (e) { 
      console.error("Dashboard Global Fetch Error:", e); 
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
         <StatTile label="الساعات التدريسية" value={stats.totalHours} sub="ساعة عمل" icon={<Clock size={24}/>} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {isAdmin && (
          <div className="lg:col-span-3 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl">
             <div className="flex items-center gap-4 mb-10">
                <LucideHistory size={28} className="text-indigo-600" />
                <h3 className="text-2xl font-black text-slate-900">أحدث العمليات المالية في المنصة</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {recentActions.map((action, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white transition-all">
                     <p className="text-[10px] font-black text-slate-400 mb-2">{new Date(action.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
                     <p className="font-black text-slate-900 mb-2 truncate">{action.students?.name}</p>
                     <span className="text-2xl font-black text-emerald-600">${action.amount}</span>
                  </div>
                ))}
                {recentActions.length === 0 && <p className="col-span-full text-center text-slate-400 font-bold py-10 italic">لا توجد عمليات مسجلة حديثاً</p>}
             </div>
          </div>
        )}

        {isAdmin && (
          <div className="lg:col-span-3 bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col">
             <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Award size={28} className="text-amber-400"/> نخبة المعلمين (الأكثر تحصيلاً)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherRankings.map((t, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black">{i+1}</div>
                        <p className="font-black text-xl">{t.name}</p>
                     </div>
                     <p className="text-3xl font-black text-emerald-400 leading-none">${t.collected}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative text-right">
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