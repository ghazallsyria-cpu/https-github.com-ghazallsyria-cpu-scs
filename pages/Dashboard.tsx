
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  ArrowUpRight, TrendingUp, Award, 
  Clock, Zap, CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';

const Dashboard = ({ role, profile }: any) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    lessonsCount: 0,
    totalIncome: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: students } = await supabase.from('student_summary_view').select('*');
      const { data: lessons } = await supabase.from('lessons').select('*');
      const { data: payments } = await supabase.from('payments').select('*');

      setStats({
        studentsCount: students?.length || 0,
        lessonsCount: lessons?.length || 0,
        totalIncome: payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
        pendingPayments: students?.reduce((acc, curr) => acc + Math.max(0, Number(curr.remaining_balance || 0)), 0) || 0
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="font-black text-slate-400 animate-pulse text-lg">جاري استخراج البيانات الذهبية...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Header with Glassmorphism Effect */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">مباشر الآن</div>
             <span className="text-slate-400 text-xs font-bold">آخر تحديث: قبل قليل</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 leading-none">ملخص <span className="text-indigo-600">الإنجاز</span></h1>
          <p className="text-slate-400 font-bold mt-4 text-lg">إليك تقرير كامل عن سير العمل التعليمي والمالي اليوم.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all cursor-pointer">
             <Clock size={28} />
          </div>
          <button className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-2xl shadow-slate-200 flex items-center gap-4 font-black hover:bg-indigo-600 transition-all active:scale-95 group">
             <Zap size={20} className="group-hover:animate-bounce" /> تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Bento Grid V2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="الطلاب النشطين" value={stats.studentsCount} sub="طالب هذا الفصل" icon={<Users />} color="blue" />
        <StatCard label="الحصص المنجزة" value={stats.lessonsCount} sub="حصة تعليمية" icon={<Calendar />} color="indigo" />
        <StatCard label="التحصيل المالي" value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي المقبوض" icon={<DollarSign />} color="emerald" />
        <StatCard label="مبالغ معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} sub="قيد التحصيل" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Financial Balance Area Chart */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative group overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-black text-slate-900">ميزان التحصيل</h3>
              <p className="text-sm font-bold text-slate-400 mt-2">تحليل المبالغ المحصلة والمتبقية لكل الفئات</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
               <TrendingUp className="text-emerald-500" />
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'المحصل الفعلي', value: stats.totalIncome, fill: '#4f46e5' },
                { name: 'الديون المعلقة', value: stats.pendingPayments, fill: '#f43f5e' }
              ]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900', fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontFamily: 'Cairo', padding: '20px'}}
                />
                <Bar dataKey="value" radius={[25, 25, 25, 25]} barSize={100}>
                  <Cell fill="#4f46e5" />
                  <Cell fill="#f43f5e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Motivational Status Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-12 rounded-[4rem] text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl">
           <div className="relative z-10">
              <div className="bg-white/10 w-20 h-20 rounded-[2rem] flex items-center justify-center text-amber-400 mb-10 border border-white/10 group-hover:rotate-12 transition-transform duration-500">
                 <Award size={40} />
              </div>
              <h3 className="text-4xl font-black mb-6 leading-tight">أداء <br/> <span className="text-indigo-400">فائق التميز!</span></h3>
              <p className="text-slate-400 font-bold text-lg leading-relaxed">
                بناءً على التقارير، أنت ضمن الفئة الأكثر التزاماً في تحصيل الحصص هذا الأسبوع.
              </p>
           </div>
           
           <div className="relative z-10 mt-12 space-y-4">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-sm">
                 <CheckCircle size={18} /> تم التحقق من كافة الحسابات
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-[2rem] font-black transition-all shadow-xl shadow-indigo-900/40 text-lg">تحميل التقرير الكامل</button>
           </div>

           {/* Decorative Spheres */}
           <div className="absolute top-[-15%] right-[-15%] w-72 h-72 bg-indigo-500/20 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-rose-500/10 blur-[60px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => {
  const themes: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100/50',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
    rose: 'bg-rose-50 text-rose-600 border-rose-100/50'
  };

  return (
    <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 group cursor-pointer relative overflow-hidden">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`${themes[color]} p-6 rounded-[2.5rem] border transition-all group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
          {React.cloneElement(icon, { size: 32 })}
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          <ArrowUpRight size={18} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</p>
        <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</h4>
        <p className="text-xs font-bold text-slate-400">{sub}</p>
      </div>
      {/* Subtle background decoration */}
      <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 -z-0 opacity-50"></div>
    </div>
  );
};

export default Dashboard;
