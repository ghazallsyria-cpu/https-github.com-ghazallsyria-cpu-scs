import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, 
  PieChart, Pie, RadialBarChart, RadialBar, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  BookOpen, Clock, TrendingUp, RefreshCw, Trophy, Target, Sparkles, Zap, Award, 
  BarChart3, Users, DollarSign, PieChart as PieIcon, Activity, CreditCard, Wallet
} from 'lucide-react';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const GRADE_COLORS = { '10': '#10b981', '11': '#8b5cf6', '12': '#4f46e5' };

const Statistics = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState({ 
    totalRevenue: 0, 
    totalDebt: 0, 
    totalExpected: 0, 
    collectionRate: 0,
    activeStudents: 0
  });
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<any[]>([]);

  const isAdmin = role === 'admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
      if (!isAdmin) query = query.eq('teacher_id', uid);
      
      const { data: stds, error } = await query;
      if (error) throw error;

      const students = stds || [];
      
      let rev = 0, debt = 0, expected = 0;
      const grades: any = { '10': 0, '11': 0, '12': 0 };
      
      students.forEach(s => {
        rev += Number(s.total_paid || 0);
        debt += Math.max(0, Number(s.remaining_balance || 0));
        expected += Number(s.agreed_amount || 0);
        if (grades[s.grade] !== undefined) grades[s.grade]++;
      });

      setFinancialStats({
        totalRevenue: rev,
        totalDebt: debt,
        totalExpected: expected,
        collectionRate: Math.round((rev / (expected || 1)) * 100),
        activeStudents: students.length
      });

      setGradeDistribution([
        { name: 'عاشر', value: grades['10'], grade: '10' },
        { name: 'حادي عشر', value: grades['11'], grade: '11' },
        { name: 'ثاني عشر', value: grades['12'], grade: '12' }
      ]);

      const studentIds = students.map(s => s.id);
      if (studentIds.length > 0) {
        let lQuery = supabase.from('lessons').select('lesson_date, hours').in('student_id', studentIds).order('lesson_date');
        const { data: lessons } = await lQuery;
        
        const grouped = (lessons || []).reduce((acc: any, curr) => {
          const date = new Date(curr.lesson_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(curr.hours);
          return acc;
        }, {});
        
        setStatsData(Object.entries(grouped).map(([name, hours]) => ({ name, hours })).slice(-15));
      }

      if (isAdmin) {
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').neq('role', 'admin');
        const teacherMetrics = students.reduce((acc: any, curr) => {
          const tid = curr.teacher_id;
          if (!acc[tid]) acc[tid] = { name: '', collected: 0, students: 0 };
          acc[tid].collected += Number(curr.total_paid || 0);
          acc[tid].students++;
          return acc;
        }, {});

        setTeacherPerformance((teachers || []).map(t => ({
          name: t.full_name,
          collected: teacherMetrics[t.id]?.collected || 0,
          students: teacherMetrics[t.id]?.students || 0
        })).sort((a, b) => b.collected - a.collected));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, role, isAdmin, year, semester]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const financialSummaryData = [
    { name: 'المحصل فعلياً', value: financialStats.totalRevenue, fill: '#10b981' },
    { name: 'الذمم المتبقية', value: financialStats.totalDebt, fill: '#f59e0b' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-32 text-right font-['Cairo']">
      
      {/* PREMIUM HEADER */}
      <div className="bg-[#1E1B4B] p-12 lg:p-20 rounded-[4.5rem] md:rounded-[5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-10">
            <span className="bg-white/10 backdrop-blur-3xl border border-white/20 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
              <Activity size={20} className="text-emerald-400" /> مركز التحليل الفائق V4.0
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter mb-6">تقرير الأداء <br/><span className="text-indigo-400">والحالة المالية الشاملة</span></h1>
          <p className="text-indigo-100/60 font-black max-w-2xl text-xl leading-relaxed">رؤية بانورامية لنمو المنصة، توزيع الطلاب، والكفاءة المالية المحققة.</p>
        </div>
        <BarChart3 className="absolute -bottom-20 -left-20 text-white/[0.03] w-[600px] h-[600px] -rotate-12 group-hover:rotate-0 transition-transform duration-[3s]" />
      </div>

      {/* KEY METRICS BENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard label="إجمالي الأرباح (المحصل)" value={`$${financialStats.totalRevenue.toLocaleString()}`} icon={<Wallet size={32}/>} color="bg-emerald-500 shadow-emerald-200" trend={`${financialStats.collectionRate}% من المستهدف`} />
        <MetricCard label="إجمالي الذمم (المتبقي)" value={`$${financialStats.totalDebt.toLocaleString()}`} icon={<CreditCard size={32}/>} color="bg-amber-500 shadow-amber-200" trend="مطالبات مالية نشطة" />
        <MetricCard label="القاعدة الطلابية" value={financialStats.activeStudents} icon={<Users size={32}/>} color="bg-indigo-600 shadow-indigo-200" trend="طالب مسجل حالياً" />
        <MetricCard label="كفاءة التحصيل" value={`${financialStats.collectionRate}%`} icon={<TrendingUp size={32}/>} color="bg-blue-500 shadow-blue-200" trend="معدل التدفق النقدي" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* FINANCIAL HEALTH CHART */}
        <div className="lg:col-span-2 bg-white p-14 lg:p-16 rounded-[4.5rem] md:rounded-[5rem] border border-slate-100 shadow-2xl relative group overflow-hidden">
           <div className="flex justify-between items-center mb-14">
              <div>
                 <h3 className="text-3xl font-black text-slate-900">ميزانية الفصل</h3>
                 <p className="text-[11px] text-slate-400 font-black uppercase mt-3 tracking-[0.3em]">تحليل المدفوعات والذمم المالية</p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-[2rem] text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-700">
                 <DollarSign size={32} />
              </div>
           </div>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={financialSummaryData} layout="vertical" barSize={50}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 14, fontWeight: 900}} width={120} />
                    <Tooltip contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 900}} />
                    <Bar dataKey="value" radius={[0, 20, 20, 0]}>
                       {financialSummaryData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* GRADE DISTRIBUTION CHART */}
        <div className="bg-white p-14 lg:p-16 rounded-[4.5rem] md:rounded-[5rem] border border-slate-100 shadow-2xl relative group flex flex-col items-center">
           <h3 className="text-2xl font-black text-slate-900 mb-10 text-center">توزيع الصفوف</h3>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={gradeDistribution} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">
                       {gradeDistribution.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS]} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '25px', border: 'none', fontFamily: 'Cairo', fontWeight: 900}} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-4 w-full mt-10">
              {gradeDistribution.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS] }}></div>
                      <span className="font-black text-slate-600 text-sm">{entry.name}</span>
                   </div>
                   <span className="font-black text-slate-900">{entry.value} طالب</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color, trend }: any) => (
  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 group relative overflow-hidden">
    <div className={`${color} w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white mb-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shadow-2xl relative z-10`}>{icon}</div>
    <div className="relative z-10">
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">{label}</p>
       <h4 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-none">{value}</h4>
       <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trend}</p>
       </div>
    </div>
  </div>
);

export default Statistics;