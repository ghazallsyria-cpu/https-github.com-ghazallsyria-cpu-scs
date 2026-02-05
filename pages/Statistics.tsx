
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { BookOpen, Clock, TrendingUp, LayoutDashboard, RefreshCw, Users, ShieldCheck, Trophy, Target, Star, Wallet } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
    <div className="space-y-10 animate-in fade-in slide-in-from-right duration-700 pb-24 text-right font-['Cairo']">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">مركز التحليل الذكي</h1>
        <p className="text-slate-500 font-bold text-lg">تقارير بيانية دقيقة حول سير العملية التعليمية.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSummaryCard label="ساعات النظام الخارجي" value={summary.hourlyHours.toFixed(1)} subValue={`${summary.hourlyLessons} حصة`} icon={<Clock size={28}/>} color="bg-amber-100 text-amber-600" />
        <StatSummaryCard label="ساعات النظام الفصلي" value={summary.fixedHours.toFixed(1)} subValue={`${summary.fixedLessons} حصة`} icon={<BookOpen size={28}/>} color="bg-indigo-100 text-indigo-600" />
        <StatSummaryCard label="متوسط مدة الحصة" value={((summary.hourlyHours + summary.fixedHours) / (summary.hourlyLessons + summary.fixedLessons || 1)).toFixed(1)} subValue="ساعة / حصة" icon={<Target size={28}/>} color="bg-emerald-100 text-emerald-600" />
        <StatSummaryCard label="إجمالي الإنتاجية" value={summary.hourlyLessons + summary.fixedLessons} subValue="إجمالي الحصص" icon={<Trophy size={28}/>} color="bg-rose-100 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl min-h-[550px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 mb-12 relative z-10">
            <TrendingUp size={32} className="text-indigo-600"/> توزيع الحصص اليومي
          </h3>
          {loading ? (
             <div className="h-full flex items-center justify-center py-20"><RefreshCw className="animate-spin text-indigo-600" size={48} /></div>
          ) : data.length > 0 ? (
            <div className="h-[380px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc', radius: 10}} contentStyle={{ borderRadius: '28px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontFamily: 'Cairo', fontWeight: 'bold' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '40px', fontSize: '12px', fontWeight: 'black'}} />
                  <Bar dataKey="hourly" name="خارجي (ساعة)" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={20} />
                  <Bar dataKey="fixed" name="فصلي (اتفاق)" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-300 font-bold italic">لا تتوفر بيانات كافية حالياً.</div>
          )}
        </div>

        {isAdmin && (
           <div className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl min-h-[550px] text-white relative overflow-hidden border border-white/5 group">
             <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
             <div className="relative z-10">
               <h3 className="text-2xl font-black flex items-center gap-4 mb-12">
                 <ShieldCheck size={32} className="text-indigo-400"/> لوحة تميز المعلمين
               </h3>
               {teacherComparison.length > 0 ? (
                 <div className="space-y-6">
                   <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={teacherComparison} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} width={100} />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)', radius: 10}} contentStyle={{ backgroundColor: '#020617', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Cairo', color: 'white' }} />
                          <Bar dataKey="lessons" name="الحصص" radius={[0, 12, 12, 0]} barSize={32}>
                             {teacherComparison.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      {teacherComparison.slice(0, 2).map((t, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4 group/card hover:bg-white/10 transition-all">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xl group-hover/card:scale-110 transition-transform">#{i+1}</div>
                           <div>
                              <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{t.name}</p>
                              <p className="text-lg font-black">{t.lessons} حصة منجزة</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center py-20 text-slate-700 font-bold italic">لا توجد سجلات حالياً.</div>
               )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

const StatSummaryCard = ({ label, value, subValue, icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex items-center gap-8 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
    <div className={`${color} p-6 rounded-[2rem] shadow-lg group-hover:rotate-12 transition-all duration-500`}>{icon}</div>
    <div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit">{subValue}</p>
    </div>
  </div>
);

export default Statistics;
