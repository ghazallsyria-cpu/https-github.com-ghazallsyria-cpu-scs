
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp, BarChart3, ArrowUpRight, GraduationCap, Target, Zap, Info, Sun, Moon, Coffee, Sparkles } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'صباح الخير والنشاط', icon: <Coffee className="text-amber-500 animate-bounce"/> };
    if (hour < 18) return { text: 'يومك سعيد ومثمر', icon: <Sun className="text-orange-500 animate-spin-slow"/> };
    return { text: 'طاب مساؤك يا بطل', icon: <Moon className="text-indigo-400 animate-pulse"/> };
  }, []);

  useEffect(() => {
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

        let lQuery = supabase.from('lessons').select('lesson_date, hours').order('lesson_date', { ascending: false }).limit(30);
        if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
        const { data: lsns } = await lQuery;

        const grouped = (lsns || []).reverse().reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});
        setChartData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [role, uid, year, semester, isAdmin]);

  const collectionRate = Math.round((stats.totalIncome / (stats.totalIncome + stats.pendingPayments || 1)) * 100);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-right">
      
      {stats.totalStudents === 0 && (
        <div className="bg-indigo-600/5 backdrop-blur-xl border border-indigo-200/50 p-8 rounded-[3rem] flex items-center gap-6 animate-pulse">
           <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-xl"><Info size={28}/></div>
           <div>
              <h4 className="font-black text-indigo-900 text-lg">لم نعثر على بيانات في {year}</h4>
              <p className="text-sm font-bold text-indigo-500/80">ربما تحتاج لتبديل "السنة الدراسية" من أعلى الصفحة لاسترجاع سجلاتك السابقة.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-12 lg:p-16 rounded-[4rem] text-white shadow-[0_40px_80px_-20px_rgba(79,70,229,0.4)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" /> إدارة المحتوى: نشطة
              </span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl lg:text-5xl">{greeting.icon}</span>
              <h1 className="text-4xl lg:text-7xl font-black leading-tight tracking-tighter">
                {greeting.text}،<br/> <span className="text-indigo-300">أهلاً بك مجدداً</span>
              </h1>
            </div>
            <p className="text-indigo-100/60 font-bold max-w-xl text-lg lg:text-xl leading-relaxed mt-4">
              أداء المنصة اليوم ممتاز، تم تسجيل <span className="text-white border-b-4 border-indigo-500 pb-1">{stats.totalLessons}</span> عملية تعليمية بنجاح.
            </p>
          </div>
          <GraduationCap className="absolute -bottom-16 -left-16 text-white/5 w-96 h-96 -rotate-12 group-hover:rotate-0 transition-transform duration-[2s]" />
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[4rem] border border-white shadow-2xl flex flex-col justify-between items-center text-center group hover:shadow-indigo-200/50 transition-all border-b-[12px] border-b-emerald-500 relative overflow-hidden">
          <div className="bg-emerald-50 text-emerald-600 p-10 rounded-[2.5rem] shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 relative z-10">
             <DollarSign size={56} />
          </div>
          <div className="relative z-10 mt-8">
            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] mb-2">الدخل الصافي</p>
            <h2 className="text-6xl font-black text-slate-900 leading-none">${stats.totalIncome.toLocaleString()}</h2>
          </div>
          <div className="mt-8 flex items-center gap-2 text-emerald-600 font-black text-[11px] bg-emerald-50 px-6 py-3 rounded-2xl relative z-10 uppercase tracking-widest">
            <Zap size={16} fill="currentColor"/> إدارة مالية
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatBento label="إجمالي الطلاب" value={stats.totalStudents} sub={`${stats.completedStudents} مكتمل`} icon={<Users size={28}/>} color="bg-blue-600" />
        <StatBento label="ساعات المحتوى" value={stats.totalHours.toFixed(1)} sub="ساعة تعليمية" icon={<Clock size={28}/>} color="bg-orange-500" />
        <StatBento label="الحصص" value={stats.totalLessons} sub="عملية منجزة" icon={<Calendar size={28}/>} color="bg-indigo-600" />
        <StatBento label="المستحقات" value={`$${stats.pendingPayments.toLocaleString()}`} sub="غير محصلة" icon={<AlertCircle size={28}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-12 lg:p-16 rounded-[4.5rem] border border-white shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-2">مؤشر الأداء</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">تحليل نشاط المحتوى خلال آخر 30 يوماً</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600"><TrendingUp size={32} /></div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.2)', fontFamily: 'Cairo', fontWeight: 900, padding: '20px', backgroundColor: 'rgba(255,255,255,0.9)'}} 
                  cursor={{stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 6'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#4f46e5" 
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                  strokeWidth={6} 
                  dot={{ r: 8, fill: '#4f46e5', strokeWidth: 5, stroke: '#fff' }} 
                  activeDot={{ r: 10, stroke: '#4f46e5', strokeWidth: 4, fill: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-950 p-14 rounded-[4.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-white/5">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
          <div className="relative z-10">
            <p className="text-indigo-400 font-black uppercase text-[12px] tracking-[0.4em] mb-10">الكفاءة المالية</p>
            <div className="flex items-baseline gap-4 mb-6">
               <h2 className="text-8xl font-black text-white tracking-tighter">{collectionRate}%</h2>
               <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl"><ArrowUpRight size={28}/></div>
            </div>
            <p className="text-slate-400 text-sm font-bold leading-relaxed">تحصيل ذكي لمستحقات المحتوى التعليمي بمعدل استقرار مرتفع.</p>
          </div>
          
          <div className="space-y-10 relative z-10 pt-16">
             <div className="w-full bg-white/5 h-10 rounded-full overflow-hidden p-2.5 border border-white/10 ring-4 ring-white/5">
               <div 
                 className="bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-400 h-full rounded-full transition-all duration-[2s] shadow-[0_0_40px_rgba(79,70,229,0.6)]" 
                 style={{ width: `${collectionRate}%` }}
               />
             </div>
             <div className="flex justify-between items-center">
                <div className="text-right">
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">المبلغ المتبقي</p>
                   <p className="text-rose-400 font-black text-2xl">${stats.pendingPayments.toLocaleString()}</p>
                </div>
                <div className="text-left">
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">المحصل فعلياً</p>
                   <p className="text-emerald-400 font-black text-2xl">${stats.totalIncome.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBento = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group overflow-hidden relative">
    <div className={`${color} w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 relative z-10 text-white shadow-2xl`}>{icon}</div>
    <div className="relative z-10">
      <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] mb-2">{label}</p>
      <p className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{value}</p>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{sub}</p>
      </div>
    </div>
    <div className={`absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-1000`}>{icon}</div>
  </div>
);

export default Dashboard;
