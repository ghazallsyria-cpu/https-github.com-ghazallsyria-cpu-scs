
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { School, BookOpen, Wallet, RefreshCw, User, GraduationCap, CheckCircle2 } from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [studentRecords, setStudentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    // البحث في جميع الطلاب الذين لديهم رقم الهاتف هذا في قائمة هواتفهم
    const { data } = await supabase.from('student_summary_view').select('*');
    
    // فلترة يدوية لأن phones هو JSONB
    const filtered = data?.filter(s => 
      s.phones?.some((p: any) => p.number === parentPhone)
    ) || [];
    
    setStudentRecords(filtered);
    setLoading(false);
  }, [parentPhone]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <RefreshCw className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="bg-slate-900 p-16 rounded-[4rem] text-white relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-5xl font-black">بوابة <span className="text-indigo-400">ولي الأمر</span></h1>
            <p className="text-xl mt-4 text-slate-400 font-bold">متابعة الأبناء مع كافة المعلمين والاشتراكات النشطة.</p>
         </div>
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full"></div>
      </div>

      {studentRecords.length > 0 ? (
        <div className="grid grid-cols-1 gap-10">
           {studentRecords.map(s => (
             <div key={s.id} className="bg-white p-12 rounded-[4rem] border shadow-sm hover:shadow-xl transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b pb-12 border-slate-50">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center font-black text-3xl">{s.name[0]}</div>
                      <div>
                         <h3 className="text-3xl font-black text-slate-900">{s.name}</h3>
                         <div className="flex items-center gap-2 text-slate-400 font-bold mt-2">
                            <BookOpen size={16} className="text-indigo-400" /> مادة: {s.teacher_subjects} | المعلم: {s.teacher_name}
                         </div>
                      </div>
                   </div>
                   <div className="bg-emerald-50 text-emerald-600 px-8 py-3 rounded-2xl font-black flex items-center gap-2">
                      <CheckCircle2 size={18} /> اشتراك نشط
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <StatItem icon={<GraduationCap />} label="الحصص المنجزة" value={`${s.total_lessons} حصة`} sub="إجمالي الكورس" color="indigo" />
                   <StatItem icon={<Wallet />} label="المسدد" value={`$${s.total_paid.toLocaleString()}`} sub="دفعات مستلمة" color="emerald" />
                   <StatItem icon={<School />} label="المتبقي" value={`$${s.remaining_balance.toLocaleString()}`} sub="رصيد قيد التحصيل" color="rose" />
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[5rem] text-center border-2 border-dashed">
           <User size={64} className="mx-auto text-slate-200 mb-8" />
           <h3 className="text-3xl font-black text-slate-900">لا توجد سجلات مرتبطة</h3>
           <p className="text-slate-400 font-bold mt-4 text-xl">تأكد من قيام المعلم بإضافة رقم هاتفك في ملف الطالب.</p>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ icon, label, value, sub, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-slate-50 p-8 rounded-[3rem] group">
       <div className={`${colors[color]} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}>
          {React.cloneElement(icon, { size: 28 })}
       </div>
       <p className="text-xs font-black text-slate-400 uppercase mb-2">{label}</p>
       <h4 className="text-4xl font-black text-slate-900 mb-2">{value}</h4>
       <p className="text-sm font-bold text-slate-400">{sub}</p>
    </div>
  );
};

export default ParentPortal;
