
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, Calendar, DollarSign, Wallet, 
  CheckCircle, ArrowUpRight, TrendingUp,
  History, Clock, Star
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const Dashboard = ({ role, profile }: any) => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    lessonsCount: 0,
    totalIncome: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const isAdmin = role === 'admin';

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

  if (loading) return <div className="flex justify-center p-20 animate-pulse text-indigo-600 font-black">جاري تحديث البيانات...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="الطلاب النشطين" value={stats.studentsCount} sub="طالب هذا الشهر" icon={<Users className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="إجمالي الحصص" value={stats.lessonsCount} sub="حصة تم إنجازها" icon={<Calendar className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard label="المحصل المالي" value={`$${stats.totalIncome.toLocaleString()}`} sub="إجمالي الإيرادات" icon={<DollarSign className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard label="المتبقي للتحصيل" value={`$${stats.pendingPayments.toLocaleString()}`} sub="مستحقات معلقة" icon={<Wallet className="text-rose-600" />} color="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">الأداء المالي العام</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">مقارنة بين المحصل والمتبقي</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-black text-slate-500 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" />
              نمو مستمر
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'المحصل', value: stats.totalIncome },
                { name: 'المتبقي', value: stats.pendingPayments }
              ]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontFamily: 'Cairo'}}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                  <Cell fill="#4f46e5" />
                  <Cell fill="#f43f5e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Component: Recent Activity */}
        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-white/10 rounded-2xl text-amber-400">
                    <Star size={24} />
                 </div>
                 <h3 className="text-xl font-black">نخبة الإنجاز</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                 <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold">1</div>
                       <div>
                          <p className="text-sm font-black">أفضل معلم تحصيلاً</p>
                          <p className="text-[10px] text-slate-400 font-bold">بناءً على التقارير المالية</p>
                       </div>
                    </div>
                    <ArrowUpRight className="text-emerald-400" />
                 </div>
                 <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold">2</div>
                       <div>
                          <p className="text-sm font-black">أكثر الطلاب التزاماً</p>
                          <p className="text-[10px] text-slate-400 font-bold">معدل حضور 100%</p>
                       </div>
                    </div>
                    <ArrowUpRight className="text-emerald-400" />
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">تم التحديث منذ لحظات</p>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <div className={`${color} p-4 rounded-2xl`}>
        {icon}
      </div>
      <div className="bg-slate-50 p-2 rounded-lg">
        <ArrowUpRight size={14} className="text-slate-400" />
      </div>
    </div>
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
    <p className="text-[10px] font-bold text-slate-400">{sub}</p>
  </div>
);

export default Dashboard;
