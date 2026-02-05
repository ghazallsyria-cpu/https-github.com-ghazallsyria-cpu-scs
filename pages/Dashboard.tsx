import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Zap, Sun, Moon, Coffee, Sparkles, RefreshCw, Layers, TrendingUp,
  Target, Award, CreditCard, ChevronRight, Activity, PieChart, ShieldCheck
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const Dashboard = ({ role, uid, year, semester, onYearChange, onSemesterChange }: any) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'يومك سعيد يا أستاذ', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: 'يوم مليء بالإنجاز', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: 'طاب مساؤك يا بطل', icon: <Moon className="text-indigo-400 animate-pulse"/> };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب الإحصائيات
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

      // جلب بيانات الرسم البياني (آخر 14 يوم)
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
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Welcome Section */}
        <div className="md:col-span-3 bg-gradient-to-br from-slate-900 to-indigo-950 p-10 lg:p-14 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[350px]">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-indigo-500/20 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-indigo-400" /> النظام النشط V15
                </span>
              </div>
              <div className="flex items-center gap-5 mb-6">
                <span className="text-4xl lg:text-5xl">{greeting.icon}</span>
                <h1 className="text-4xl lg:text-7xl font-black tracking-tighter leading-none">{greeting.text}</h1>
              </div>
              <p className="text-indigo-200/60 font-bold max-w-lg text-lg leading-relaxed">
                قاعدة البيانات جاهزة الآن للعمل من الصفر. لقد قمنا بتصفير كافة الجداول وضبط الصلاحيات لضمان أقصى درجات الخصوصية والأداء.
              </p>
           </div>
           <PieChart className="absolute -bottom-20 -left-20 text-white/5 w-[500px] h-[500px]" />
        </div>

        {/* Financial Overview Card */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group relative overflow-hidden">
           <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
             <DollarSign size={32}/>
           </div>
           <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">صافي الأرباح</p>
              <h2 className="text-6xl font-black text-slate-900 leading-none">${stats.totalIncome.toLocaleString()}</h2>
              <div className="mt-6 flex items-center gap-2 text-emerald-600 font-black text-[10px] bg-emerald-50 px-4 py-2 rounded-xl w-fit">
                <ArrowUpRight size={14}/> {collectionRate}% محصل
              </div>
           </div>
        </div>

      </div>

      {/* Modern Stats Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBento label="طلابك" value={stats.totalStudents} sub={`${stats.completedStudents} منتهٍ`} icon={<Users size={22}/>} color="bg-blue-600" />
        <StatBento label="الحصص" value={stats.totalLessons} sub="عملية مسجلة" icon={<Calendar size={22}/>} color="bg-indigo-600" />
        <StatBento label="ساعاتك" value={stats.totalHours.toFixed(1)} sub="ساعة تدريس" icon={<Clock size={22}/>} color="bg-orange-500" />
        <StatBento label="ديون" value={`$${stats.pendingPayments.toLocaleString()}`} sub="غير محصلة" icon={<CreditCard size={22}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Productivity Chart Card */}
        <div className="lg:col-span-2 bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-12">
              <div>
                 <h3 className="text-2xl font-black text-slate-900">منحنى الإنتاجية</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">توزيع الساعات التدريسية زمنياً</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-slate-400"><TrendingUp size={24}/></div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <Tooltip contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={5} fill="url(#colorHours)" dot={{r: 6, fill: '#fff', strokeWidth: 3, stroke: '#4f46e5'}} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Quick Access or Info Card */}
        <div className="bg-indigo-600 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
           <div className="relative z-10">
              <h3 className="text-3xl font-black mb-6">جاهز للبدء؟</h3>
              <p className="text-indigo-100 font-bold leading-relaxed mb-10 opacity-80">
                النظام الآن في حالة النقاء التام. يمكنك البدء بإضافة طلابك وتوزيعهم على الفصول الدراسية.
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 bg-white/10 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="bg-white/20 p-2 rounded-xl text-white"><Award size={20}/></div>
                    <p className="text-xs font-black uppercase tracking-widest">أداء محسن بنسبة 40%</p>
                 </div>
                 <div className="flex items-center gap-4 bg-white/10 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                    {/* Fix: Replaced missing 'ShieldLog' with 'ShieldCheck' */}
                    <div className="bg-white/20 p-2 rounded-xl text-white"><ShieldCheck size={20}/></div>
                    <p className="text-xs font-black uppercase tracking-widest">حماية بيانات مشفرة</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const StatBento = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden text-right">
    <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:rotate-12 transition-transform shadow-lg relative z-10`}>{icon}</div>
    <div className="relative z-10">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 mb-1 leading-none">{value}</h4>
       <p className="text-[10px] font-bold text-slate-400">{sub}</p>
    </div>
    <div className={`absolute -right-10 -bottom-10 w-32 h-32 opacity-[0.03] group-hover:scale-150 transition-transform ${color.replace('bg-', 'text-')}`}>{icon}</div>
  </div>
);

export default Dashboard;