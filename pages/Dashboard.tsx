import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, Clock, DollarSign, ArrowUpRight, GraduationCap, 
  Sun, Moon, Coffee, RefreshCw, TrendingUp, Award, CreditCard, 
  Activity, PieChart, ShieldCheck, Sparkles, Zap
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: any) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'يوم سعيد يا أستاذ', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: 'مساء مليء بالتميز', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: 'ليلة هادئة ومثمرة', icon: <Moon className="text-indigo-400 animate-pulse"/> };
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

      setStats({
        totalStudents: totals.students,
        totalLessons: totals.lessons,
        totalHours: totals.hours,
        totalIncome: totals.income,
        pendingPayments: totals.debts,
        completedStudents: totals.completed
      });

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Upper Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Hero Card */}
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-12 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <Sparkles size={16} className="text-amber-400" /> الحالة الفعالة للنظام
                </span>
              </div>
              <div className="flex items-center gap-6 mb-8">
                <span className="text-5xl lg:text-6xl">{greeting.icon}</span>
                <h1 className="text-4xl lg:text-7xl font-black leading-none">{greeting.text}</h1>
              </div>
              <p className="text-indigo-100/60 font-bold max-w-xl text-xl leading-relaxed">
                مرحباً بك في لوحة تحكم القمة. إليك نظرة سريعة على أدائك التعليمي والمالي اليوم.
              </p>
           </div>
           <Zap className="absolute -bottom-20 -left-20 text-white/5 w-[500px] h-[500px] -rotate-12" />
        </div>

        {/* Profit Bento */}
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col justify-between group overflow-hidden relative">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-all duration-700"></div>
           <div className="bg-emerald-500 text-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-100 group-hover:scale-110 transition-transform duration-500 relative z-10">
             <DollarSign size={40}/>
           </div>
           <div className="relative z-10">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">إجمالي التحصيل</p>
              <h2 className="text-6xl font-black text-slate-900 leading-none mb-6 tracking-tighter">${stats.totalIncome.toLocaleString()}</h2>
              <div className="flex items-center gap-3 text-emerald-600 font-black text-xs bg-emerald-50 px-6 py-3 rounded-2xl w-fit shadow-inner">
                <TrendingUp size={18}/> {collectionRate}% محصل
              </div>
           </div>
        </div>

      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <StatBento label="إجمالي الطلاب" value={stats.totalStudents} sub={`${stats.completedStudents} مكتمل`} icon={<Users size={28}/>} color="bg-indigo-600" />
        <StatBento label="الحصص المنفذة" value={stats.totalLessons} sub="حصة مسجلة" icon={<Calendar size={28}/>} color="bg-blue-500" />
        <StatBento label="ساعات التدريس" value={stats.totalHours.toFixed(1)} sub="ساعة فعلية" icon={<Clock size={28}/>} color="bg-amber-500" />
        <StatBento label="مستحقات معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} sub="ديون طلاب" icon={<CreditCard size={28}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Productivity Chart */}
        <div className="lg:col-span-2 bg-white p-12 lg:p-16 rounded-[4.5rem] border border-slate-100 shadow-2xl">
           <div className="flex justify-between items-center mb-16">
              <div>
                 <h3 className="text-3xl font-black text-slate-900">مؤشر الإنتاجية</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mt-2">معدل الحصص خلال الـ 15 يوماً الماضية</p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-3xl text-indigo-600 shadow-inner"><Activity size={32}/></div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                    <Tooltip contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900, padding: '20px'}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={6} fill="url(#colorHours)" dot={{r: 7, fill: '#fff', strokeWidth: 4, stroke: '#4f46e5'}} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Tip/Info Card */}
        <div className="bg-slate-900 p-14 rounded-[4.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-white/10">
           <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="relative z-10">
              <h3 className="text-3xl font-black mb-8 leading-tight">جاهز للحصة <br/>القادمة؟</h3>
              <p className="text-slate-400 font-bold leading-relaxed mb-12 text-lg">
                لقد قمت بإنجاز {stats.totalLessons} حصة هذا الفصل الدراسي. حافظ على هذا المستوى المرتفع من الأداء.
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-5 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
                    <div className="bg-indigo-600/40 p-3 rounded-2xl text-white shadow-lg"><Award size={24}/></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-300">أعلى أداء شهري</p>
                 </div>
                 <div className="flex items-center gap-5 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
                    <div className="bg-emerald-600/40 p-3 rounded-2xl text-white shadow-lg"><ShieldCheck size={24}/></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">البيانات محمية بالكامل</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const StatBento = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative overflow-hidden">
    <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:rotate-12 transition-transform shadow-xl relative z-10`}>{icon}</div>
    <div className="relative z-10">
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
       <h4 className="text-5xl font-black text-slate-900 mb-2 leading-none tracking-tighter">{value}</h4>
       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sub}</p>
    </div>
    <div className={`absolute -right-12 -bottom-12 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-1000 ${color.replace('bg-', 'text-')}`}>{icon}</div>
  </div>
);

export default Dashboard;