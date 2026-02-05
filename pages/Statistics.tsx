
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';
import { BookOpen, Clock, TrendingUp, RefreshCw, Trophy, Target, Sparkles, Zap, Award, BarChart3 } from 'lucide-react';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const Statistics = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [teacherComparison, setTeacherComparison] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hourlyHours: 0, fixedHours: 0, hourlyLessons: 0, fixedLessons: 0 });
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: periodStudents } = await supabase.from('students').select('id').eq('academic_year', year).eq('semester', semester);
      const studentIds = periodStudents?.map(s => s.id) || [];
      
      if (studentIds.length === 0) {
        setLoading(false);
        return;
      }

      let lQuery = supabase.from('lessons').select('*, students(is_hourly, teacher_id)').in('student_id', studentIds);
      if (!isAdmin) lQuery = lQuery.eq('teacher_id', uid);
      
      const { data: lsns } = await lQuery;
      
      let hH = 0, fH = 0, hL = 0, fL = 0;
      const grouped = (lsns || []).reduce((acc: any, curr) => {
        const date = curr.lesson_date;
        const isHourly = curr.students?.is_hourly;
        const hoursValue = Number(curr.hours) || 0;
        
        if (isHourly) { hH += hoursValue; hL++; }
        else { fH += hoursValue; fL++; }

        if (!acc[date]) acc[date] = { date, hourly: 0, fixed: 0 };
        if (isHourly) acc[date].hourly += hoursValue;
        else acc[date].fixed += hoursValue;
        
        return acc;
      }, {});

      setSummary({ hourlyHours: hH, fixedHours: fH, hourlyLessons: hL, fixedLessons: fL });
      setData(Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-15));

      if (isAdmin) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        const teacherMap = (lsns || []).reduce((acc: any, curr) => {
          const tid = curr.teacher_id;
          if (!acc[tid]) acc[tid] = { name: '', lessons: 0, hours: 0 };
          acc[tid].lessons++;
          acc[tid].hours += Number(curr.hours) || 0;
          return acc;
        }, {});

        setTeacherComparison((teachers || []).map(t => ({
          name: t.full_name,
          lessons: teacherMap[t.id]?.lessons || 0,
          hours: teacherMap[t.id]?.hours || 0,
        })).sort((a, b) => b.lessons - a.lessons));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 text-right font-['Cairo']">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-12 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" /> تحليل البيانات الذكي
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tighter mb-4">مرصد الأداء <br/><span className="text-indigo-300">والإحصائيات الرقمية</span></h1>
          <p className="text-indigo-100/60 font-bold max-w-xl text-lg">رؤية شاملة ودقيقة لتحركات المحتوى التعليمي والإنتاجية المحققة.</p>
        </div>
        <BarChart3 className="absolute -bottom-12 -left-12 text-white/5 w-80 h-80 -rotate-12 group-hover:rotate-0 transition-transform duration-[2s]" />
      </div>

      {/* Stats Summary Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <StatSummaryCard label="ساعات النظام الخارجي" value={summary.hourlyHours.toFixed(1)} subValue={`${summary.hourlyLessons} حصة`} icon={<Clock size={28}/>} color="bg-orange-500" />
        <StatSummaryCard label="ساعات النظام الفصلي" value={summary.fixedHours.toFixed(1)} subValue={`${summary.fixedLessons} حصة`} icon={<BookOpen size={28}/>} color="bg-indigo-600" />
        <StatSummaryCard label="متوسط مدة الحصة" value={((summary.hourlyHours + summary.fixedHours) / (summary.hourlyLessons + summary.fixedLessons || 1)).toFixed(1)} subValue="ساعة / حصة" icon={<Target size={28}/>} color="bg-emerald-500" />
        <StatSummaryCard label="إجمالي الإنتاجية" value={summary.hourlyLessons + summary.fixedLessons} subValue="إجمالي الحصص" icon={<Award size={28}/>} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-12 lg:p-16 rounded-[4.5rem] border border-white shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-2">مخطط النشاط الزمني</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">توزيع ساعات العمل خلال آخر 15 يوماً</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600 group-hover:scale-110 transition-transform"><TrendingUp size={32} /></div>
          </div>
          
          <div className="h-[400px] w-full">
            {loading ? (
               <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" size={48} /></div>
            ) : data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 900}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 900}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ borderRadius: '28px', border: 'none', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.15)', fontFamily: 'Cairo', fontWeight: 900, padding: '20px', backgroundColor: 'rgba(255,255,255,0.9)' }} 
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '40px', fontSize: '12px', fontWeight: 900}} />
                  <Bar dataKey="hourly" name="خارجي (ساعة)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="fixed" name="فصلي (اتفاق)" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 font-black italic">لا توجد بيانات مسجلة حالياً.</div>
            )}
          </div>
        </div>

        {/* Admin Leaderboard Card */}
        {isAdmin && (
           <div className="bg-slate-950 p-12 lg:p-14 rounded-[4.5rem] shadow-2xl text-white relative overflow-hidden group border border-white/5 flex flex-col">
             <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
             
             <div className="relative z-10 mb-12">
               <div className="flex items-center gap-4 mb-4">
                 <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-500/20"><Trophy size={28}/></div>
                 <h3 className="text-2xl font-black">تميز مديري المحتوى</h3>
               </div>
               <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest">تحليل الكفاءة حسب عدد الحصص</p>
             </div>

             <div className="flex-1 space-y-6 relative z-10 overflow-y-auto no-scrollbar pr-2">
               {teacherComparison.length > 0 ? (
                 teacherComparison.map((t, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between group/card hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-2 border-white/10 transition-transform group-hover/card:scale-110`} style={{ backgroundColor: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                            {i === 0 ? <Zap size={24} fill="currentColor"/> : i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{t.name}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t.hours.toFixed(1)} ساعة إجمالية</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black leading-none" style={{ color: COLORS[i % COLORS.length] }}>{t.lessons}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase mt-1">حصة</p>
                       </div>
                    </div>
                 ))
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-700 font-black italic">لا يوجد سجلات نشطة.</div>
               )}
             </div>
             
             <div className="mt-10 relative z-10 bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center animate-pulse">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">إجمالي الحصص المنجزة للمنصة</p>
                <p className="text-3xl font-black">{teacherComparison.reduce((acc, curr) => acc + curr.lessons, 0)}</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

const StatSummaryCard = ({ label, value, subValue, icon, color }: any) => (
  <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group overflow-hidden relative">
    <div className={`${color} w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 relative z-10 text-white shadow-2xl shadow-indigo-100`}>{icon}</div>
    <div className="relative z-10">
      <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] mb-2">{label}</p>
      <p className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{value}</p>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse`}></div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{subValue}</p>
      </div>
    </div>
    <div className={`absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-150 transition-all duration-1000 text-slate-900`}>{icon}</div>
  </div>
);

export default Statistics;
