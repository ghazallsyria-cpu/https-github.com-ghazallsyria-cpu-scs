
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.ts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BookOpen, Clock, TrendingUp, PieChart as PieIcon, LayoutDashboard } from 'lucide-react';

// Fix: Added year and semester props to the component signature and type definition.
const Statistics = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hourlyHours: 0, fixedHours: 0, hourlyLessons: 0, fixedLessons: 0 });
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fix: Added logic to filter statistics by the selected academic year and semester.
        const { data: periodStudents } = await supabase
          .from('students')
          .select('id')
          .eq('academic_year', year)
          .eq('semester', semester);
        
        const studentIds = periodStudents?.map(s => s.id) || [];

        let lQuery = supabase
          .from('lessons')
          .select('*, students(is_hourly)')
          .in('student_id', studentIds);
          
        if (!isAdmin) {
          lQuery = lQuery.eq('teacher_id', uid);
        }
        
        const { data: lsns } = await lQuery;
        
        let hH = 0, fH = 0, hL = 0, fL = 0;
        
        const grouped = (lsns || []).reduce((acc: any, curr) => {
          const date = curr.lesson_date;
          const isHourly = curr.students?.is_hourly;
          
          if (isHourly) { hH += Number(curr.hours); hL++; }
          else { fH += Number(curr.hours); fL++; }

          if (!acc[date]) acc[date] = { date, hourly: 0, fixed: 0 };
          if (isHourly) acc[date].hourly += Number(curr.hours);
          else acc[date].fixed += Number(curr.hours);
          
          return acc;
        }, {});
        
        setSummary({ hourlyHours: hH, fixedHours: fH, hourlyLessons: hL, fixedLessons: fL });

        const chartData = Object.values(grouped)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-15);
          
        setData(chartData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [uid, role, isAdmin, year, semester]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">تحليل الأداء التعليمي</h1>
        <p className="text-slate-500 font-bold">مقارنة بين كثافة العمل في النظام الخارجي (ساعة) والاتفاق الفصلي.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSummaryCard 
          label="ساعات النظام الخارجي" 
          value={summary.hourlyHours.toFixed(1)} 
          subValue={`${summary.hourlyLessons} حصة`}
          icon={<Clock size={24}/>} 
          color="bg-amber-100 text-amber-600" 
        />
        <StatSummaryCard 
          label="ساعات النظام الفصلي" 
          value={summary.fixedHours.toFixed(1)} 
          subValue={`${summary.fixedLessons} حصة`}
          icon={<BookOpen size={24}/>} 
          color="bg-indigo-100 text-indigo-600" 
        />
        <StatSummaryCard 
          label="متوسط ساعات الحصة" 
          value={((summary.hourlyHours + summary.fixedHours) / (summary.hourlyLessons + summary.fixedLessons || 1)).toFixed(1)} 
          subValue="ساعة / حصة"
          icon={<TrendingUp size={24}/>} 
          color="bg-emerald-100 text-emerald-600" 
        />
        <StatSummaryCard 
          label="إجمالي الحصص" 
          value={summary.hourlyLessons + summary.fixedLessons} 
          subValue="لكافة الطلاب"
          icon={<LayoutDashboard size={24}/>} 
          color="bg-slate-100 text-slate-600" 
        />
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm min-h-[500px]">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <TrendingUp size={24} className="text-indigo-600"/> توزيع الحصص اليومي حسب النوع
          </h3>
        </div>
        {loading ? (
           <div className="h-full flex items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo' }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '30px', fontSize: '12px', fontWeight: 'bold'}} />
              <Bar dataKey="hourly" name="حصص خارجية (ساعة)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="fixed" name="حصص فصلية (اتفاق)" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 font-bold">
            <PieIcon size={64} className="mb-4 opacity-10" />
            <p>لا توجد بيانات كافية لعرض الرسم البياني.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatSummaryCard = ({ label, value, subValue, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
    <div className={`${color} p-5 rounded-3xl shadow-sm`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{subValue}</p>
    </div>
  </div>
);

export default Statistics;
