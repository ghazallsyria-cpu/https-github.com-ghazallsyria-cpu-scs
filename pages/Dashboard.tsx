import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Zap, Sun, Moon, Coffee, Sparkles, RefreshCw, Layers, TrendingUp,
  Target, Award, CreditCard, ChevronRight
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester, onYearChange, onSemesterChange }: any) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataAudit, setDataAudit] = useState<any[]>([]);

  const isAdmin = role === 'admin';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'صباح الخير والنشاط', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: 'يومك سعيد ومثمر', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: 'طاب مساؤك يا بطل', icon: <Moon className="text-indigo-400 animate-pulse"/> };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. فحص شامل لوجود البيانات (لراحة المستخدم)
      const { data: allStds } = await supabase.from('students').select('academic_year, semester');
      if (allStds) {
        const counts = allStds.reduce((acc: any, curr) => {
          const key = `${curr.academic_year} - الفصل ${curr.semester}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        setDataAudit(Object.entries(counts).map(([label, count]) => ({ label, count: count as number })));
      }

      // 2. إحصائيات الفترة الحالية
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

      // 3. الرسم البياني للنشاط
      let lQuery = supabase.from('lessons').select('lesson_date, hours').order('lesson_date', { ascending: false }).limit(14);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 lg:p-12 rounded-[3rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-300" /> السنة الأكاديمية: {year}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{greeting.icon}</span>
                <h1 className="text-3xl lg:text-5xl font-black tracking-tight">{greeting.text}</h1>
              </div>
              <p className="text-indigo-100 font-bold max-w-md leading-relaxed opacity-90">
                 نظام الإدارة الرقمي للمحتوى التعليمي. لديك حالياً <span className="text-white underline decoration-amber-400 decoration-4 underline-offset-4">{stats.totalStudents} طالب</span> مسجل في الفترة المختارة.
              </p>
           </div>
           <GraduationCap className="absolute -bottom-12 -left-12 text-white/10 w-64 h-64 -rotate-12" />
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group overflow-hidden relative">
           <div className="flex justify-between items-start relative z-10">
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={28}/></div>
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest">مكتمل بنسبة {collectionRate}%</div>
           </div>
           <div className="mt-8 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صافي التحصيل</p>
              <h2 className="text-5xl font-black text-slate-900">${stats.totalIncome.toLocaleString()}</h2>
              <p className="text-[11px] font-bold text-slate-400 mt-2">من إجمالي مستحق { (stats.totalIncome + stats.pendingPayments).toLocaleString() }</p>
           </div>
           <div className="absolute -right-8 -bottom-8 bg-emerald-50 w-32 h-32 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="إجمالي الطلاب" value={stats.totalStudents} sub={`${stats.completedStudents} منجز`} icon={<Users size={22}/>} color="bg-blue-600" />
        <StatCard label="الحصص المنفذة" value={stats.totalLessons} sub="حصة درسية" icon={<Calendar size={22}/>} color="bg-indigo-600" />
        <StatCard label="ساعات العمل" value={stats.totalHours.toFixed(1)} sub="ساعة تعليمية" icon={<Clock size={22}/>} color="bg-orange-500" />
        <StatCard label="المستحقات" value={`$${stats.pendingPayments.toLocaleString()}`} sub="لم يتم تحصيلها" icon={<Zap size={22}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <div>
                 <h3 className="text-xl font-black text-slate-900">مؤشر الإنتاجية</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">تتبع ساعات العمل لآخر 14 يوماً</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><TrendingUp size={24}/></div>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={4} fill="url(#colorHours)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Data Audit Panel */}
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden flex flex-col">
           <div className="relative z-10 mb-8">
              <h3 className="text-xl font-black flex items-center gap-3"><Layers size={24} className="text-indigo-400"/> أرشيف البيانات</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">فحص التواجد في السنوات الأخرى</p>
           </div>
           
           <div className="flex-1 space-y-4 relative z-10 overflow-y-auto no-scrollbar">
              {dataAudit.length > 0 ? dataAudit.map((item, i) => (
                <button key={i} onClick={() => { 
                   const parts = item.label.split(' - الفصل ');
                   onYearChange(parts[0]);
                   onSemesterChange(parts[1]);
                }} className="w-full bg-white/5 hover:bg-white/10 p-5 rounded-3xl border border-white/5 flex items-center justify-between transition-all group">
                   <div className="text-right">
                      <p className="text-sm font-black">{item.label}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase mt-1">{item.count} سجل موجود</p>
                   </div>
                   <ChevronRight size={18} className="text-indigo-500 group-hover:translate-x-[-4px] transition-transform rotate-180"/>
                </button>
              )) : (
                <p className="text-slate-500 text-center py-10 font-bold italic">لا توجد بيانات مسجلة في أي فترة.</p>
              )}
           </div>

           <div className="mt-8 pt-8 border-t border-white/5 relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <span>الحالة الكلية للبيانات</span>
                 <span className="text-emerald-400">آمنة</span>
              </div>
              <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40">
                <RefreshCw size={14}/> تحديث حالة الاتصال
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg relative z-10`}>{icon}</div>
    <div className="relative z-10">
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
       <p className="text-[9px] font-bold text-slate-400">{sub}</p>
    </div>
    <div className={`absolute -right-8 -bottom-8 w-24 h-24 opacity-5 group-hover:scale-150 transition-transform ${color.replace('bg-', 'text-')}`}>{icon}</div>
  </div>
);

export default Dashboard;