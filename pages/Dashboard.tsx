
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  Award, Zap, PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Dashboard = ({ role, profile }: any) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    lessonsCount: 0,
    totalIncome: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        // جلب الطلاب المحسوبين حسب الصلاحيات
        let qStds = supabase.from('student_summary_view').select('*');
        if (!isAdmin) qStds = qStds.eq('teacher_id', profile.id);
        const { data: stds } = await qStds;

        // جلب إحصائيات الحصص
        let qLss = supabase.from('lessons').select('id');
        if (!isAdmin) qLss = qLss.eq('teacher_id', profile.id);
        const { data: lss } = await qLss;

        // جلب إحصائيات الدفعات
        let qPay = supabase.from('payments').select('amount');
        if (!isAdmin) qPay = qPay.eq('teacher_id', profile.id);
        const { data: pays } = await qPay;

        setStats({
          studentsCount: stds?.length || 0,
          lessonsCount: lss?.length || 0,
          totalIncome: (pays || []).reduce((acc, c) => acc + Number(c.amount || 0), 0),
          pendingPayments: (stds || []).reduce((acc, c) => acc + Math.max(0, Number(c.remaining_balance || 0)), 0),
        });
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAdmin, profile?.id]);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400">تحليل بيانات القمة...</p>
    </div>
  );

  const chartData = [
    { name: 'المحصل', value: stats.totalIncome, fill: '#4f46e5' },
    { name: 'المتبقي', value: stats.pendingPayments, fill: '#f43f5e' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl font-black text-slate-900 leading-none mb-4">ملخص <span className="text-indigo-600">الإنجاز</span></h1>
          <p className="text-slate-400 font-bold text-xl">مرحباً {profile?.full_name}، إليك مراجعة شاملة للأداء.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={24} /></div>
           <div className="pr-6 pl-10"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديث البيانات</p><p className="font-black text-slate-900">مباشر الآن</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="الطلاب" value={stats.studentsCount} sub="طالب نشط" icon={<Users />} color="blue" />
        <StatCard label="الحصص" value={stats.lessonsCount} sub="حصة منجزة" icon={<Calendar />} color="indigo" />
        <StatCard label="المحصل" value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي المقبوض" icon={<DollarSign />} color="emerald" />
        <StatCard label="المتبقي" value={`$${stats.pendingPayments.toLocaleString()}`} sub="ديون قيد التحصيل" icon={<Wallet />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border shadow-sm h-[500px]">
           <h3 className="text-3xl font-black text-slate-900 mb-12">التوازن المالي</h3>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontFamily: 'Cairo'}} />
                    <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={80}>
                       {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <div className="bg-indigo-600/30 w-20 h-20 rounded-[2rem] flex items-center justify-center text-amber-400 mb-10 border border-white/10"><Award size={40} /></div>
              <h3 className="text-4xl font-black mb-6 leading-tight">مركز <br/> <span className="text-indigo-400">تحليل القمة</span></h3>
              <p className="text-slate-400 font-bold text-lg leading-relaxed">
                {isAdmin ? 'بصفتك مديراً، يمكنك متابعة كافة الحركات المالية والأكاديمية للنظام بشكل مركزي.' : 'توضح هذه الإحصائيات مجهودك التعليمي وحصادك المالي خلال الفترة الحالية.'}
              </p>
           </div>
           <button className="relative z-10 w-full bg-indigo-600 py-6 rounded-[2rem] font-black shadow-xl hover:bg-indigo-500 transition-all">تصدير التقرير العام</button>
           <div className="absolute top-[-15%] right-[-15%] w-72 h-72 bg-indigo-500/20 blur-[100px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => {
  const themes: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
      <div className={`${themes[color]} w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:scale-110`}>{React.cloneElement(icon, { size: 32 })}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{label}</p>
      <h4 className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{value}</h4>
      <p className="text-xs font-bold text-slate-400">{sub}</p>
    </div>
  );
};

export default Dashboard;
