
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  ArrowUpRight, TrendingUp, Star, Award, 
  Clock, Zap
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
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 animate-pulse">جاري تحليل البيانات...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 leading-tight">نظرة عامة على <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">الأداء</span></h1>
          <p className="text-slate-400 font-bold mt-2">إحصائيات حية تعكس تقدمك التعليمي والمالي.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all">
             <Clock size={24} />
          </button>
          <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 font-black cursor-pointer hover:bg-indigo-700 transition-all">
             <Zap size={20} /> تحديث فوري
          </div>
        </div>
      </div>

      {/* Modern Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب النشطين" value={stats.studentsCount} trend="+12%" icon={<Users />} color="blue" />
        <StatCard label="الحصص المنجزة" value={stats.lessonsCount} trend="+5%" icon={<Calendar />} color="indigo" />
        <StatCard label="التحصيل المالي" value={`$${stats.totalIncome.toLocaleString()}`} trend="+20%" icon={<DollarSign />} color="emerald" />
        <StatCard label="مبالغ معلقة" value={`$${stats.pendingPayments.toLocaleString()}`} trend="-2%" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900">الميزان المالي</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">المحصل vs المتبقي</p>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
               <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'المحصل', value: stats.totalIncome },
                { name: 'المتبقي', value: stats.pendingPayments }
              ]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontFamily: 'Cairo'}}
                />
                <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={80}>
                  <Cell fill="#4f46e5" />
                  <Cell fill="#f43f5e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Motivation Card */}
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden group">
           <div className="relative z-10">
              <div className="bg-amber-400/20 w-16 h-16 rounded-3xl flex items-center justify-center text-amber-400 mb-8 border border-amber-400/30">
                 <Award size={32} />
              </div>
              <h3 className="text-3xl font-black mb-4 leading-tight">أنت تحقق <br/> <span className="text-indigo-400">تقدماً مذهلاً!</span></h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                استناداً إلى نشاطك الأخير، ارتفع معدل التحصيل العلمي بنسبة 15% مقارنة بالشهر الماضي.
              </p>
           </div>
           
           <div className="relative z-10 mt-12">
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 py-5 rounded-2xl font-black transition-all">تحميل تقرير الأداء</button>
           </div>

           {/* Decorative elements */}
           <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-700"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-rose-500/10 blur-[60px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`${colors[color]} p-5 rounded-3xl transition-transform group-hover:scale-110`}>
          {React.cloneElement(icon, { size: 28 })}
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-1">
          <TrendingUp size={12} className={trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} />
          <span className={`text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[10px] font-bold text-slate-400">مشاهدة التفاصيل</span>
         <ArrowUpRight size={14} className="text-indigo-600" />
      </div>
    </div>
  );
};

export default Dashboard;
