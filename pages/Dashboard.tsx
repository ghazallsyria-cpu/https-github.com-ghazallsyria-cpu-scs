
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, Activity, TrendingUp, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const Dashboard = ({ role, profile, isAdminActual, monitoredTeacher }: any) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    lessonsCount: 0,
    totalIncome: 0,
    pendingPayments: 0,
    teacherCount: 0,
    activeLessonsLastWeek: 0
  });
  const [teachersComparison, setTeachersComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isGlobalView = isAdminActual && !monitoredTeacher;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // الطلاب
        let qStds = supabase.from('student_summary_view').select('*');
        if (!isGlobalView) qStds = qStds.eq('teacher_id', profile.id);
        const { data: stds } = await qStds;

        // الحصص
        let qLss = supabase.from('lessons').select('id, created_at, teacher_id');
        if (!isGlobalView) qLss = qLss.eq('teacher_id', profile.id);
        const { data: lss } = await qLss;

        // الدفعات
        let qPay = supabase.from('payments').select('amount');
        if (!isGlobalView) qPay = qPay.eq('teacher_id', profile.id);
        const { data: pays } = await qPay;

        let tCount = 0;
        if (isGlobalView) {
           const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
           tCount = count || 0;

           // جلب بيانات المعلمين للمقارنة
           const { data: teachers } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher');
           if (teachers) {
              const comp = await Promise.all(teachers.map(async (t) => {
                 const { data: tStds } = await supabase.from('students').select('id').eq('teacher_id', t.id);
                 return { name: t.full_name, students: tStds?.length || 0 };
              }));
              setTeachersComparison(comp.sort((a, b) => b.students - a.students));
           }
        }

        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: (pays || []).reduce((acc, c) => acc + Number(c.amount || 0), 0),
          pendingPayments: (stds || []).reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0),
          teacherCount: tCount,
          activeLessonsLastWeek: (lss || []).filter(l => {
             const d = new Date(l.created_at);
             const now = new Date();
             return (now.getTime() - d.getTime()) < (7 * 24 * 60 * 60 * 1000);
          }).length
        });
      } catch (err) {
        console.error("Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher]);

  if (loading) return (
    <div className="h-[50vh] flex flex-col items-center justify-center gap-6">
       <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400">جاري تجميع البيانات الإحصائية...</p>
    </div>
  );

  const financialChartData = [
    { name: 'المحصل', value: stats.totalIncome },
    { name: 'المتبقي', value: stats.pendingPayments }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
             {isGlobalView ? 'المدير العام' : monitoredTeacher ? `مراقبة: ${monitoredTeacher.full_name}` : 'لوحة المعلم'}
          </span>
          <h1 className="text-5xl font-black text-slate-900 leading-none">الإحصائيات <span className="text-indigo-600">البيانية</span></h1>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><Activity /></div>
           <div><p className="text-[10px] font-black text-slate-400">حالة البيانات</p><p className="font-black text-slate-900">محدثة لحظياً</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard label="إجمالي الطلاب" value={stats.studentsCount} sub="طالباً مسجلاً" icon={<Users />} color="blue" />
        <DashboardCard label="إجمالي الحصص" value={stats.lessonsCount} sub="حصة تعليمية" icon={<Calendar />} color="indigo" />
        <DashboardCard label="السيولة المحصلة" value={`$${stats.totalIncome.toLocaleString()}`} sub="مدفوعات مستلمة" icon={<DollarSign />} color="emerald" />
        <DashboardCard label="ديون معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} sub="قيد التحصيل" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border shadow-sm">
           <h3 className="text-2xl font-black mb-10 flex items-center gap-3"><TrendingUp className="text-indigo-600" /> الرسم البياني للمالية</h3>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={financialChartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis hide />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fill="url(#colorVal)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <Zap className="text-amber-400 mb-6" size={40} />
              <h3 className="text-3xl font-black mb-4 text-indigo-300">تقرير الأداء</h3>
              <p className="text-slate-400 font-bold mb-8">نظرة سريعة على معدلات النمو الحالية للنظام.</p>
              
              <div className="space-y-6">
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-slate-300">حصص الأسبوع الأخير</span>
                    <span className="text-2xl font-black">{stats.activeLessonsLastWeek}</span>
                 </div>
                 {isGlobalView && (
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                       <span className="text-slate-300">المعلمون النشطون</span>
                       <span className="text-2xl font-black">{stats.teacherCount}</span>
                    </div>
                 )}
              </div>
           </div>
           <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]"></div>
        </div>
      </div>

      {isGlobalView && teachersComparison.length > 0 && (
        <div className="bg-white p-12 rounded-[4rem] border shadow-sm">
           <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><ShieldCheck className="text-emerald-600" /> توزيع الطلاب على المعلمين</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachersComparison.map((t, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center group hover:bg-indigo-600 hover:text-white transition-all cursor-default shadow-inner">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-900 group-hover:text-indigo-600 shadow-sm">{t.name[0]}</div>
                      <span className="font-black">{t.name}</span>
                   </div>
                   <span className="bg-white/10 px-4 py-2 rounded-xl text-xs font-black">{t.students} طالب</span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const DashboardCard = ({ label, value, sub, icon, color }: any) => {
  const themes: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className={`${themes[color]} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10`}>{React.cloneElement(icon, { size: 28 })}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest relative z-10">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mb-1 relative z-10">{value}</h4>
      <p className="text-xs font-bold text-slate-300 relative z-10">{sub}</p>
      <div className={`absolute -right-6 -top-6 w-24 h-24 ${themes[color]} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
    </div>
  );
};

export default Dashboard;
