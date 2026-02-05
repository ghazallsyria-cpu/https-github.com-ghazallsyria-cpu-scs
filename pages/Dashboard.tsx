import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
// Added RefreshCw to imports
import { Users, Calendar, Clock, DollarSign, AlertCircle, TrendingUp, BarChart3, ArrowUpRight, GraduationCap, Target, Zap, Info, Sun, Moon, Coffee, Sparkles, SearchX, Search, Database, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ role, uid, year, semester, onYearChange, onSemesterChange }: any) => {
  const [stats, setStats] = useState({
    totalStudents: 0, totalLessons: 0, totalHours: 0, totalIncome: 0, pendingPayments: 0, completedStudents: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allDataFound, setAllDataFound] = useState<any[]>([]);

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
        // 1. الكاشف الشامل (Deep Scan): البحث في كل السنوات والفصول
        // نقوم بجلب كل الطلاب المرتبطين بهذا المعلم أياً كانت السنة
        let finderQuery = supabase.from('students').select('academic_year, semester');
        if (!isAdmin) finderQuery = finderQuery.eq('teacher_id', uid);
        const { data: allStds } = await finderQuery;

        if (allStds && allStds.length > 0) {
          const periods = allStds.reduce((acc: any[], curr: any) => {
             const key = `${curr.academic_year}-${curr.semester}`;
             const existing = acc.find(p => p.key === key);
             if (existing) existing.count++;
             else acc.push({ key, year: curr.academic_year, semester: curr.semester, count: 1 });
             return acc;
          }, []);
          setAllDataFound(periods.sort((a, b) => b.year.localeCompare(a.year)));
        } else {
          setAllDataFound([]);
        }

        // 2. جلب إحصائيات الفترة المختارة حالياً
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

        // 3. بيانات الرسم البياني
        let lQuery = supabase.from('lessons').select('lesson_date, hours').order('lesson_date', { ascending: false }).limit(30);
        if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
        const { data: lsns } = await lQuery;

        const grouped = (lsns || []).reverse().reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});
        setChartData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })));
      } catch (err) { console.error("Dashboard Error:", err); } finally { setLoading(false); }
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
      
      {/* تنبيه ذكي في حال وجود بيانات في فترات أخرى */}
      {allDataFound.length > 0 && stats.totalStudents === 0 && (
        <div className="bg-indigo-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden animate-in zoom-in duration-700">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-6 mb-8">
                 <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20">
                    <Layers size={32} className="text-indigo-300" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black">بياناتك موجودة في الأرشيف!</h2>
                    <p className="text-indigo-200 font-bold text-sm">لم نجد طلاباً في {year} الفصل {semester}، ولكننا عثرنا عليهم في الفترات التالية:</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {allDataFound.map(p => (
                   <button 
                     key={p.key} 
                     onClick={() => { onYearChange(p.year); onSemesterChange(p.semester); }}
                     className="bg-white/10 hover:bg-white/20 border border-white/10 p-6 rounded-3xl flex items-center justify-between transition-all group"
                   >
                      <div className="text-right">
                         <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{p.year}</p>
                         <p className="text-lg font-black">الفصل {p.semester}</p>
                         <p className="text-[10px] font-bold text-indigo-400 mt-1">{p.count} طالب مسجل</p>
                      </div>
                      <ArrowRight size={20} className="rotate-180 group-hover:translate-x-[-10px] transition-transform" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* الحالة عندما تكون القاعدة فارغة تماماً حتى من الأرشيف */}
      {allDataFound.length === 0 && (
        <div className="bg-white p-12 lg:p-20 rounded-[4.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center gap-8 shadow-sm">
           <div className="bg-slate-50 p-10 rounded-full text-slate-200"><Database size={80}/></div>
           <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900">قاعدة البيانات فارغة</h2>
              <p className="text-slate-400 font-bold max-w-md">لم يتم العثور على أي بيانات مرتبطة بحسابك في أي سنة أو فصل دراسي. إذا كان لديك بيانات سابقة، يرجى تشغيل كود SQL V12 من الإعدادات.</p>
           </div>
           {/* Fixed RefreshCw not being imported */}
           <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all"><RefreshCw size={20}/> تحديث المحاولة</button>
        </div>
      )}

      {stats.totalStudents > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-12 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                  <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
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
                  أداء المنصة اليوم ممتاز في <span className="text-white border-b-4 border-indigo-500 pb-1">{year}</span>، تم تسجيل <span className="text-white border-b-4 border-indigo-500 pb-1">{stats.totalLessons}</span> عملية تعليمية بنجاح.
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
        </>
      )}
    </div>
  );
};

const StatBento = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group overflow-hidden relative text-right">
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