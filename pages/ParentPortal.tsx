
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { School, BookOpen, Wallet, RefreshCw, User, GraduationCap, CheckCircle2, UserCheck, Star } from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // استدعاء الوظيفة البرمجية التي تربط ولي الأمر بكافة طلابه ومعلميهم
    const { data } = await supabase.rpc('get_parent_dashboard', { parent_phone_val: parentPhone });
    setRecords(data || []);
    setLoading(false);
  }, [parentPhone]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400">جاري جلب التقارير من كافة المعلمين...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-right">
            <div>
               <h1 className="text-5xl font-black mb-4">بوابة <span className="text-indigo-400">ولي الأمر</span></h1>
               <p className="text-xl text-slate-400 font-bold max-w-xl">متابعة دقيقة للأداء الدراسي والالتزامات المالية لكافة الأبناء.</p>
            </div>
            <div className="bg-white/10 p-8 rounded-[3rem] backdrop-blur-xl border border-white/10 flex items-center gap-6 shadow-2xl">
               <div className="bg-indigo-500 p-4 rounded-2xl"><UserCheck size={32} /></div>
               <div>
                  <p className="text-xs font-black uppercase text-indigo-300">الربط النشط</p>
                  <p className="text-3xl font-black">{records.length} مواد دراسية</p>
               </div>
            </div>
         </div>
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      </div>

      {records.length > 0 ? (
        <div className="grid grid-cols-1 gap-10">
           {records.map((r, idx) => (
             <div key={idx} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b pb-12 border-slate-50">
                   <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">{r.student_name[0]}</div>
                      <div>
                         <h3 className="text-4xl font-black text-slate-900 mb-2">{r.student_name}</h3>
                         <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-2 bg-slate-50 text-slate-600 px-5 py-2 rounded-full text-sm font-black"><BookOpen size={16} className="text-indigo-500" /> {r.teacher_subjects}</span>
                            <span className="flex items-center gap-2 bg-slate-50 text-slate-600 px-5 py-2 rounded-full text-sm font-black"><User size={16} className="text-emerald-500" /> المعلم: {r.teacher_name}</span>
                         </div>
                      </div>
                   </div>
                   <div className="bg-emerald-50 text-emerald-600 px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 border border-emerald-100">
                      <CheckCircle2 size={24} /> متابعة نشطة
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <StatCard icon={<GraduationCap />} label="الحصص المنجزة" value={`${r.total_lessons} حصة`} sub="إجمالي التفاعل الدراسي" color="indigo" />
                   <StatCard icon={<Wallet />} label="إجمالي المسدد" value={`$${r.total_paid}`} sub="مدفوعات موثقة" color="emerald" />
                   <StatCard icon={<School />} label="المتبقي" value={`$${r.remaining_balance}`} sub="رصيد قيد التحصيل" color="rose" />
                </div>

                <div className="absolute top-10 left-10 text-slate-100 -rotate-12 pointer-events-none group-hover:text-indigo-50 transition-colors">
                   <Star size={120} strokeWidth={3} />
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[5rem] text-center border-2 border-dashed border-slate-200">
           <User size={80} className="mx-auto text-slate-200 mb-8" />
           <h3 className="text-4xl font-black text-slate-900 mb-4">لا توجد سجلات مرتبطة حالياً</h3>
           <p className="text-slate-400 font-bold text-xl max-w-md mx-auto leading-relaxed">يرجى التأكد من قيام المعلمين بإضافة رقم هاتفك (<span className="text-indigo-600 font-black">{parentPhone}</span>) في ملفات أبنائك لديهم.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-slate-50 p-10 rounded-[3rem] group border border-transparent hover:border-slate-200 transition-all">
       <div className={`${colors[color]} w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:rotate-12 transition-transform`}>
          {React.cloneElement(icon, { size: 32 })}
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 mb-2">{value}</h4>
       <p className="text-sm font-bold text-slate-400">{sub}</p>
    </div>
  );
};

export default ParentPortal;
