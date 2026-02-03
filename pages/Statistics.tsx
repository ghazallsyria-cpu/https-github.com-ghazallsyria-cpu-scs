
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock,
  ChevronDown,
  Filter,
  Download,
  Users
} from 'lucide-react';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b'];

const Statistics = ({ role, uid }: { role: any, uid: string }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dayHours: 0,
    monthHours: 0,
    semesterHours: 0,
    totalIncome: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [studentDistribution, setStudentDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let qLessons = supabase.from('lessons').select('*');
        let qPayments = supabase.from('payments').select('*');
        let qStudents = supabase.from('students').select('id, name');

        if (role === 'teacher') {
          qLessons = qLessons.eq('teacher_id', uid);
          qPayments = qPayments.eq('teacher_id', uid);
          qStudents = qStudents.eq('teacher_id', uid);
        }

        const [
          { data: lessons }, 
          { data: payments }, 
          { data: students }
        ] = await Promise.all([qLessons, qPayments, qStudents]);

        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfSemester = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);

        const dHours = (lessons || []).filter(l => new Date(l.lesson_date) >= startOfDay).reduce((s, l) => s + Number(l.hours), 0);
        const mHours = (lessons || []).filter(l => new Date(l.lesson_date) >= startOfMonth).reduce((s, l) => s + Number(l.hours), 0);
        const sHours = (lessons || []).filter(l => new Date(l.lesson_date) >= startOfSemester).reduce((s, l) => s + Number(l.hours), 0);
        const income = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

        setStats({ dayHours: dHours, monthHours: mHours, semesterHours: sHours, totalIncome: income });

        // Last 7 days activity
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyMap: any = {};
        last7Days.forEach(day => dailyMap[day] = 0);
        lessons?.forEach(l => {
          if (dailyMap[l.lesson_date] !== undefined) dailyMap[l.lesson_date] += Number(l.hours);
        });

        setDailyData(Object.entries(dailyMap).map(([date, hours]) => ({ 
          date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }), 
          hours 
        })));

        // Student distribution based on hours
        const studentMap: any = {};
        lessons?.forEach(l => {
          const sName = students?.find(s => s.id === l.student_id)?.name || 'طالب مجهول';
          studentMap[sName] = (studentMap[sName] || 0) + Number(l.hours);
        });
        
        const distribution = Object.entries(studentMap)
          .map(([name, value]) => ({ name, value: Number(value) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setStudentDistribution(distribution);

      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, uid]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-slate-500">جاري تحليل البيانات وإعداد التقارير...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">تحليلات الأداء</h1>
          <p className="text-slate-500 mt-1 font-bold">رؤى تفصيلية حول ساعات العمل والنمو المالي.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold shadow-sm hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            <span>تصفية</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">
            <Download size={18} />
            <span>تصدير التقرير</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSummaryCard label="ساعات اليوم" value={stats.dayHours} icon={<Clock size={20}/>} color="bg-indigo-600" isDark />
        <StatSummaryCard label="ساعات الشهر" value={stats.monthHours} icon={<TrendingUp size={20}/>} color="bg-white" />
        <StatSummaryCard label="إجمالي الفصل" value={stats.semesterHours} icon={<Calendar size={20}/>} color="bg-white" />
        <StatSummaryCard label="الدخل المحصل" value={`$${stats.totalIncome}`} icon={<DollarSign size={20}/>} color="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-900">النشاط اليومي (آخر 7 أيام)</h3>
            <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">ساعة/يوم</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', textAlign: 'right', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="hours" name="ساعات" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-900">توزيع الساعات حسب الطالب</h3>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">أفضل 6 طلاب</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  nameKey="name"
                >
                  {studentDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 'bold', fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-6">ملاحظات الأداء</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <p className="text-indigo-900 font-black mb-2 flex items-center gap-2"><TrendingUp size={18}/> نمو مستمر</p>
            <p className="text-indigo-700/80 text-sm font-bold leading-relaxed">زاد عدد الساعات التعليمية بنسبة 15% مقارنة بالشهر الماضي. استمر في هذا الأداء الرائع.</p>
          </div>
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
            <p className="text-emerald-900 font-black mb-2 flex items-center gap-2"><DollarSign size={18}/> استقرار مالي</p>
            <p className="text-emerald-700/80 text-sm font-bold leading-relaxed">نسبة التحصيل المالي وصلت لـ 92%. ننصح بمتابعة الدفعات المتبقية لضمان تدفق نقدي مثالي.</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
            {/* Added missing Users icon from lucide-react */}
            <p className="text-blue-900 font-black mb-2 flex items-center gap-2"><Users size={18}/> رضا الطلاب</p>
            <p className="text-blue-700/80 text-sm font-bold leading-relaxed">متوسط الحصص لكل طالب مرتفع، مما يشير إلى ولاء الطلاب واستمراريتهم معك.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatSummaryCard = ({ label, value, icon, color, isDark = false }: any) => (
  <div className={`${color} p-6 rounded-3xl border ${isDark ? 'border-transparent shadow-xl shadow-indigo-100' : 'border-slate-200 shadow-sm'} flex flex-col justify-between hover:scale-[1.02] transition-transform`}>
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/20 text-white' : 'bg-slate-50 text-indigo-600'}`}>
      {icon}
    </div>
    <div>
      <p className={`text-xs font-bold mb-1 ${isDark ? 'text-indigo-100' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </div>
  </div>
);

export default Statistics;
