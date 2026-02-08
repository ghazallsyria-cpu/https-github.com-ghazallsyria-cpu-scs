
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, PieChart as PieIcon, TrendingUp, ShieldCheck, Activity, UserPlus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, YAxis
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
  const [teachersData, setTeachersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // المنطق هنا: إذا كان المدير يراقب معلماً، نعامل بروفايل المعلم وكأنه المستخدم الحالي.
  // أما إذا كان المدير في "المنظور العام"، نأتي بإحصائيات كل النظام.
  const isGlobalView = isAdminActual && !monitoredTeacher;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let qStds = supabase.from('student_summary_view').select('*');
        if (!isGlobalView) qStds = qStds.eq('teacher_id', profile.id);
        const { data: stds } = await qStds;

        let qLss = supabase.from('lessons').select('id, created_at');
        if (!isGlobalView) qLss = qLss.eq('teacher_id', profile.id);
        const { data: lss } = await qLss;

        let qPay = supabase.from('payments').select('amount');
        if (!isGlobalView) qPay = qPay.eq('teacher_id', profile.id);
        const { data: pays } = await qPay;

        let tCount = 0;
        if (isGlobalView) {
           const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
           tCount = count || 0;

           // جلب بيانات المعلمين للمقارنة البيانية
           const { data: teachers } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher');
           if (teachers) {
              const enriched = await Promise.all(teachers.map(async (t) => {
                 const { data: tStds } = await supabase.from('students').select('id').eq('teacher_id', t.id);
                 return { name: t.full_name, students: tStds?.length || 0 };
              }));
              setTeachersData(enriched);
           }
        }

        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: (pays || []).reduce((acc, c) => acc + Number(c.amount || 0), 0),
          pendingPayments: (stds || []).reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0),
          teacherCount: tCount,
          activeLessonsLastWeek: (lss || []).filter(l => {
             const date = new Date(l.created_at);
             const now = new Date();
             return (now.getTime() - date.getTime()) < (7 * 24 * 60 * 60 * 1000);
          }).length
        });
      } catch (err) {
        console.error("Dashboard Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isGlobalView, profile?.id, monitoredTeacher]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400 italic">جاري تحميل البيانات الذكية...</p>
    </div>
  );

  const financialData = [
    { name: 'المحصل', value: stats.totalIncome, fill: '#4f46e5' },
    { name: 'المتبقي', value: stats.pendingPayments, fill: '#f43f5e' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
             <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Activity size={10} /> {isGlobalView ? 'نظرة شمولية' : monitoredTeacher ? 'منظور المراقبة' : 'منظور المعلم'}
             </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 leading-none mb-4">مركز <span className="text-indigo-600">الإحصائيات</span></h1>
          <p className="text-slate-400 font-bold text-lg">
             {isGlobalView ? 'ملخص أداء المنصة بالكامل لجميع المعلمين.' : monitoredTeacher ? `أنت تستعرض حالياً أداء المعلم: ${monitoredTeacher.full_name}` : 'مرحباً، إليك ملخص نشاطك الأكاديمي الحالي.'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={20} /></div>
           <div className="pr-4 pl-8"><p className="text-[10px] font-black text-slate-400 uppercase">بيانات مباشرة</p><p className="font-black text-slate-900 leading-tight">محدث الآن</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب" value={stats.studentsCount} sub="إجمالي الطلاب" icon={<Users />} color="blue" />
        <StatCard label="الحصص" value={stats.lessonsCount} sub="حصص منجزة" icon={<Calendar />} color="indigo" />
        <StatCard label="المحصل" value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي السيولة" icon={<DollarSign />} color="emerald" />
        <StatCard label="المتبقي" value={`$${stats.pendingPayments.toLocaleString()}`} sub="تحت التحصيل" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Overview Chart */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900">الموقف المالي العام</h3>
              <div className="bg-slate-50 p-2 rounded-xl flex gap-1">
                 <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                 <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
              </div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={financialData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Global Distribution or Teacher Performance */}
        <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
           <div className="relative z-10">
              <div className="bg-indigo-600/30 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-amber-400 mb-8 border border-white/10 group-hover:scale-110 transition-transform"><TrendingUp size={32} /></div>
              <h3 className="text-3xl font-black mb-6">تقرير <span className="text-indigo-400">النمو</span></h3>
              
              <div className="space-y-6">
                 {isGlobalView ? (
                   <>
                     <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                        <span className="text-slate-400 font-bold">عدد المعلمين</span>
                        <span className="text-2xl font-black text-white">{stats.teacherCount}</span>
                     </div>
                     <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                        <span className="text-slate-400 font-bold">نمو الطلاب (أسبوع)</span>
                        <span className="text-2xl font-black text-emerald-400">+{stats.activeLessonsLastWeek}</span>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                        <span className="text-slate-400 font-bold">حصة/أسبوع</span>
                        <span className="text-2xl font-black text-white">{Math.ceil(stats.lessonsCount / 4)}</span>
                     </div>
                     <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                        <span className="text-slate-400 font-bold">كفاءة التحصيل</span>
                        <span className="text-2xl font-black text-amber-400">%{Math.round((stats.totalIncome / (stats.totalIncome + stats.pendingPayments)) * 100) || 0}</span>
                     </div>
                   </>
                 )}
              </div>
           </div>
           
           <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full"></div>
           <button className="relative z-10 mt-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all">
              <Activity size={20} /> عرض التقرير الكامل
           </button>
        </div>
      </div>

      {/* Admin Specific: Teacher Comparison Table */}
      {isGlobalView && teachersData.length > 0 && (
         <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-8">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4"><ShieldCheck className="text-indigo-600" /> توزيع الطلاب على المعلمين</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {teachersData.map((t, i) => (
                 <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">{t.name[0]}</div>
                       <span className="font-black text-slate-700">{t.name}</span>
                    </div>
                    <span className="bg-white px-4 py-2 rounded-xl text-indigo-600 font-black text-xs shadow-sm">{t.students} طالب</span>
                 </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => {
  const themes: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
      <div className={`${themes[color]} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10`}>{React.cloneElement(icon, { size: 28 })}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest relative z-10">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mb-1 relative z-10">{value}</h4>
      <p className="text-xs font-bold text-slate-300 relative z-10">{sub}</p>
      <div className={`absolute top-0 right-0 w-24 h-24 ${themes[color]} opacity-5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
    </div>
  );
};

export default Dashboard;
