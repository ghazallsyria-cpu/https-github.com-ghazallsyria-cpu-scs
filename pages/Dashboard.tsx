
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  ArrowUpRight, TrendingUp, Award, 
  Clock, Zap, CheckCircle, UserRound, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Dashboard = ({ role, profile }: any) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    lessonsCount: 0,
    totalIncome: 0,
    pendingPayments: 0,
    teachersCount: 0,
    parentsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: students } = await supabase.from('student_summary_view').select('*');
      const { data: lessons } = await supabase.from('lessons').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      
      let teachers = 0, parents = 0;
      if (isAdmin) {
         const { data: profiles } = await supabase.from('profiles').select('role');
         teachers = profiles?.filter(p => p.role === 'teacher').length || 0;
         parents = profiles?.filter(p => p.role === 'parent').length || 0;
      }

      setStats({
        studentsCount: students?.length || 0,
        lessonsCount: lessons?.length || 0,
        totalIncome: payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
        pendingPayments: students?.reduce((acc, curr) => acc + Math.max(0, Number(curr.remaining_balance || 0)), 0) || 0,
        teachersCount: teachers,
        parentsCount: parents
      });
      setLoading(false);
    };
    fetchStats();
  }, [isAdmin]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative"><div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div><div className="absolute inset-0 w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div></div>
      <p className="font-black text-slate-400 animate-pulse text-lg">جاري استخراج البيانات الذهبية...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4"><div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">مباشر الآن</div></div>
          <h1 className="text-5xl font-black text-slate-900 leading-none">{isAdmin ? 'لوحة ' : 'ملخص '} <span className="text-indigo-600">{isAdmin ? 'التحكم' : 'الإنجاز'}</span></h1>
          <p className="text-slate-400 font-bold mt-4 text-lg">نظام القمة: تقرير ذكاء الأعمال والعمليات التعليمية.</p>
        </div>
        <button className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black"><Zap size={20} /> تحديث البيانات</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isAdmin ? (
          <>
            <StatCard label="المعلمون" value={stats.teachersCount} sub="معلم معتمد" icon={<ShieldCheck />} color="indigo" />
            <StatCard label="أولياء الأمور" value={stats.parentsCount} sub="حساب مرتبط" icon={<UserRound />} color="blue" />
          </>
        ) : (
          <>
            <StatCard label="الطلاب" value={stats.studentsCount} sub="طالب نشط" icon={<Users />} color="blue" />
            <StatCard label="الحصص" value={stats.lessonsCount} sub="حصة منجزة" icon={<Calendar />} color="indigo" />
          </>
        )}
        <StatCard label="التحصيل" value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي المقبوض" icon={<DollarSign />} color="emerald" />
        <StatCard label="الديون" value={`$${stats.pendingPayments.toLocaleString()}`} sub="قيد التحصيل" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
          <h3 className="text-3xl font-black text-slate-900 mb-12">ميزان التحصيل</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'المحصل', value: stats.totalIncome, fill: '#4f46e5' }, { name: 'المعلق', value: stats.pendingPayments, fill: '#f43f5e' }]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontFamily: 'Cairo'}} />
                <Bar dataKey="value" radius={[25, 25, 25, 25]} barSize={100}><Cell fill="#4f46e5" /><Cell fill="#f43f5e" /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-12 rounded-[4rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <div className="bg-white/10 w-20 h-20 rounded-[2rem] flex items-center justify-center text-amber-400 mb-10 border border-white/10"><Award size={40} /></div>
              <h3 className="text-4xl font-black mb-6">ذكاء <br/> <span className="text-indigo-400">القمة</span></h3>
              <p className="text-slate-400 font-bold text-lg">النظام يربط حالياً بين {stats.teachersCount} معلم و {stats.parentsCount} ولي أمر عبر {stats.studentsCount} طالب.</p>
           </div>
           <button className="relative z-10 w-full bg-indigo-600 py-6 rounded-[2rem] font-black shadow-xl">تحميل التقرير الكامل</button>
           <div className="absolute top-[-15%] right-[-15%] w-72 h-72 bg-indigo-500/20 blur-[100px] rounded-full"></div>
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
    <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
      <div className="flex justify-between items-start mb-8">
        <div className={`${themes[color]} p-6 rounded-[2.5rem] border transition-all group-hover:scale-110 shadow-inner`}>{React.cloneElement(icon, { size: 32 })}</div>
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 transition-colors"><ArrowUpRight size={18} /></div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</p>
      <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</h4>
      <p className="text-xs font-bold text-slate-400">{sub}</p>
    </div>
  );
};

export default Dashboard;
