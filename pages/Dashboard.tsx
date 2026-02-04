
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp, BarChart3, ArrowUpRight, User, LayoutGrid } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, 
    totalLessons: 0, 
    totalHours: 0, 
    totalIncome: 0, 
    pendingPayments: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<any[]>([]);
  const [periodicStats, setPeriodicStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // الفلترة بناءً على السنة والفصل الدراسي
        let qSt = supabase.from('students').select('*, profiles:teacher_id(full_name)').eq('academic_year', year).eq('semester', semester);
        
        // جلب معرفات الطلاب في الفترة المختارة لفلترة الحصص والمدفوعات
        const { data: periodStudents } = await qSt;
        const studentIds = periodStudents?.map(s => s.id) || [];

        let qLe = supabase.from('lessons').select('*, profiles:teacher_id(full_name)').in('student_id', studentIds).order('lesson_date', { ascending: true });
        let qPa = supabase.from('payments').select('*, profiles:teacher_id(full_name)').in('student_id', studentIds);
        let qProf = supabase.from('profiles').select('id, full_name').neq('role', 'admin');

        if (!isAdmin) {
          qSt = qSt.eq('teacher_id', uid);
          qLe = qLe.eq('teacher_id', uid);
          qPa = qPa.eq('teacher_id', uid);
        }

        const [
          { data: stds }, 
          { data: lsns }, 
          { data: pays },
          { data: profiles }
        ] = await Promise.all([qSt, qLe, qPa, qProf]);

        // حسابات دورية
        const now = new Date();
        const startOfDay = new Date(new Date().setHours(0,0,0,0)).toISOString().split('T')[0];
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
        const startOfWeek = oneWeekAgo.toISOString().split('T')[0];
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const dailyLsns = (lsns || []).filter(l => l.lesson_date >= startOfDay).length;
        const weeklyLsns = (lsns || []).filter(l => l.lesson_date >= startOfWeek).length;
        const monthlyLsns = (lsns || []).filter(l => l.lesson_date >= startOfMonth).length;
        
        setPeriodicStats({ daily: dailyLsns, weekly: weeklyLsns, monthly: monthlyLsns });

        const totalHours = (lsns || []).reduce((sum, l) => sum + Number(l.hours), 0);
        const totalIncome = (pays || []).reduce((sum, p) => sum + Number(p.amount), 0);
        
        const totalAgreed = (stds || []).reduce((sum, s) => {
          if (s.is_hourly) {
            const sLsns = (lsns || []).filter(l => l.student_id === s.id);
            const sHours = sLsns.reduce((h, l) => h + Number(l.hours), 0);
            return sum + (sHours * Number(s.price_per_hour));
          }
          return sum + Number(s.agreed_amount);
        }, 0);

        setStats({
          totalStudents: stds?.length || 0,
          totalLessons: lsns?.length || 0,
          totalHours,
          totalIncome,
          pendingPayments: Math.max(0, totalAgreed - totalIncome)
        });

        const grouped = (lsns || []).reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});

        const formatted = Object.entries(grouped).map(([name, hours]) => ({ name, hours }));
        setChartData(formatted.length > 0 ? formatted.slice(-10) : [{name: 'لا بيانات', hours: 0}]);

        if (isAdmin && profiles) {
          const perf = profiles.map(p => {
            const pStds = (stds || []).filter(s => s.teacher_id === p.id);
            const pLsns = (lsns || []).filter(l => l.teacher_id === p.id);
            const pPays = (pays || []).filter(pay => pay.teacher_id === p.id);
            
            const pHours = pLsns.reduce((h, l) => h + Number(l.hours), 0);
            const pIncome = pPays.reduce((i, pay) => i + Number(pay.amount), 0);
            const pExpected = pStds.reduce((sum, s) => {
              if (s.is_hourly) {
                const sLsns = pLsns.filter(l => l.student_id === s.id);
                const sHours = sLsns.reduce((h, l) => h + Number(l.hours), 0);
                return sum + (sHours * Number(s.price_per_hour));
              }
              return sum + Number(s.agreed_amount);
            }, 0);

            return {
              name: p.full_name,
              students: pStds.length,
              lessons: pLsns.length,
              hours: pHours,
              income: pIncome,
              debt: Math.max(0, pExpected - pIncome)
            };
          });
          setTeacherPerformance(perf);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role, uid, isAdmin, year, semester]);

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">{year}</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">الفصل الدراسي {semester}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'إحصائيات المنظومة العامة' : 'لوحة تحكم المعلم'}
          </h1>
          <p className="text-slate-500 font-bold mt-2">
            ملخص الأداء لهذه الفترة الزمنية المحددة.
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <PeriodicBadge label="اليوم" value={periodicStats.daily} color="text-emerald-600" />
            <PeriodicBadge label="أسبوع" value={periodicStats.weekly} color="text-indigo-600" />
            <PeriodicBadge label="شهر" value={periodicStats.monthly} color="text-purple-600" />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard label="الطلاب" value={stats.totalStudents} icon={<Users size={20}/>} color="bg-blue-600" />
        <StatCard label="إجمالي الحصص" value={stats.totalLessons} icon={<Calendar size={20}/>} color="bg-indigo-600" />
        <StatCard label="مجموع الساعات" value={stats.totalHours.toFixed(1)} icon={<Clock size={20}/>} color="bg-amber-600" />
        <StatCard label="المقبوضات" value={`$${stats.totalIncome.toLocaleString()}`} icon={<DollarSign size={20}/>} color="bg-emerald-600" />
        <StatCard label="الديون المعلقة" value={`$${stats.pendingPayments.toLocaleString()}`} icon={<AlertCircle size={20}/>} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-[450px]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black flex items-center gap-3 text-slate-900">
              <TrendingUp className="text-indigo-600" /> كثافة الحصص (ساعات)
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo'}} />
                <Area type="monotone" dataKey="hours" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHours)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 p-20 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <BarChart3 size={200} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-3">الدخل الإجمالي المتوقع</p>
            <h2 className="text-5xl font-black">${(stats.totalIncome + stats.pendingPayments).toLocaleString()}</h2>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-black mt-4">
              <ArrowUpRight size={18} /> <span>للفصل الدراسي المختار</span>
            </div>
          </div>
          <div className="space-y-6 relative z-10">
             <div className="flex justify-between items-end">
               <div>
                 <p className="text-slate-500 text-[10px] font-black uppercase">المحصل نقدياً</p>
                 <p className="font-black text-emerald-400 text-2xl">${stats.totalIncome.toLocaleString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-slate-500 text-[10px] font-black uppercase">الديون</p>
                 <p className="font-black text-rose-400 text-2xl">${stats.pendingPayments.toLocaleString()}</p>
               </div>
             </div>
             <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
               <div 
                 className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                 style={{ width: `${(stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100}%` }}
               />
             </div>
          </div>
        </div>
      </div>

      {isAdmin && teacherPerformance.length > 0 && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom duration-700">
           <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600 shadow-sm"><LayoutGrid size={28}/></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">تقارير أداء المعلمين</h3>
                <p className="text-slate-400 font-bold text-sm">مراقبة الحصص والديون للفصل الدراسي {semester}.</p>
              </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-right">
               <thead>
                 <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                   <th className="p-6">المعلم</th>
                   <th className="p-6 text-center">الطلاب</th>
                   <th className="p-6 text-center">الحصص</th>
                   <th className="p-6 text-center">الساعات</th>
                   <th className="p-6">المبالغ المستلمة</th>
                   <th className="p-6">ديون الطلاب</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {teacherPerformance.map((tp, idx) => (
                   <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                     <td className="p-6">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                           {tp.name.charAt(0)}
                         </div>
                         <span className="font-black text-slate-900">{tp.name}</span>
                       </div>
                     </td>
                     <td className="p-6 text-center font-bold text-slate-600">{tp.students}</td>
                     <td className="p-6 text-center font-bold text-slate-600">{tp.lessons}</td>
                     <td className="p-6 text-center font-bold text-slate-600">{tp.hours.toFixed(1)}</td>
                     <td className="p-6 font-black text-emerald-600">${tp.income.toLocaleString()}</td>
                     <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black ${tp.debt > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          ${tp.debt.toLocaleString()}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
    <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
  </div>
);

const PeriodicBadge = ({ label, value, color }: any) => (
  <div className="px-6 py-3 text-center border-l last:border-l-0 border-slate-50 min-w-[80px]">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{label}</p>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

export default Dashboard;
