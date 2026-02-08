
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { BookOpen, Wallet, User, GraduationCap, CalendarDays, Clock, FileText, ChevronRight, LayoutDashboard } from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>({ lessons: [], schedule: [], payments: [] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_parent_dashboard', { parent_phone_val: parentPhone });
    if (error) console.error(error);
    setRecords(data || []);
    setLoading(false);
  }, [parentPhone]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchFullDetails = async (record: any) => {
    setLoading(true);
    try {
      const [lss, sch, pay] = await Promise.all([
        supabase.from('lessons').select('*').eq('student_id', record.student_id).order('lesson_date', { ascending: false }),
        supabase.from('schedules').select('*').eq('student_id', record.student_id).order('start_time'),
        supabase.from('payments').select('*').eq('student_id', record.student_id).order('payment_date', { ascending: false })
      ]);
      setDetails({ lessons: lss.data || [], schedule: sch.data || [], payments: pay.data || [] });
      setSelectedRecord(record);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedRecord) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400 text-sm">جاري جلب ملفاتك الدراسية...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-32 text-right" dir="rtl">
      <div className="bg-slate-900 p-10 md:p-14 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-black mb-4 flex items-center gap-4">
                <GraduationCap className="text-indigo-400" size={48} /> ملف <span className="text-indigo-400">الطالب</span>
            </h1>
            <p className="text-slate-400 font-bold max-w-xl">مرحباً بك. هنا يمكنك متابعة حصصك الدراسية، جدول المواعيد، وكشف الحساب المالي بشكل مباشر.</p>
         </div>
         {selectedRecord && (
            <button onClick={() => setSelectedRecord(null)} className="absolute top-10 left-10 hidden md:flex items-center gap-2 px-6 py-3 bg-white/10 rounded-2xl font-black text-xs hover:bg-white/20 transition-all">
               العودة للقائمة
            </button>
         )}
      </div>

      {!selectedRecord ? (
        <div className="grid grid-cols-1 gap-6">
           {records.length > 0 ? records.map((r, idx) => (
             <div key={idx} onClick={() => fetchFullDetails(r)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer overflow-hidden relative">
                <div className="flex flex-col md:flex-row items-center gap-8">
                   <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.8rem] flex items-center justify-center font-black text-3xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">{r.student_name[0]}</div>
                   <div className="text-center md:text-right flex-1">
                      <h3 className="text-2xl font-black text-slate-900 mb-2">{r.student_name}</h3>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                         <span className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border border-slate-100"><BookOpen size={14} /> {r.teacher_subjects}</span>
                         <span className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border border-slate-100"><User size={14} /> المعلم: {r.teacher_name}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الحصص</p>
                         <p className="text-xl font-black text-slate-900">{r.total_lessons}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div className="text-center">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المتبقي</p>
                         <p className={`text-xl font-black ${r.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${r.remaining_balance}</p>
                      </div>
                      <ChevronRight className="text-slate-200 group-hover:text-indigo-600 rotate-180 transition-all" />
                   </div>
                </div>
             </div>
           )) : (
             <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                <User size={48} className="mx-auto text-slate-100 mb-4" />
                <h3 className="text-xl font-black text-slate-400">لا توجد بيانات مرتبطة بهذا الهاتف</h3>
                <p className="text-slate-300 font-bold mt-2 text-sm">يرجى الطلب من المعلم إضافة هاتفك ({parentPhone}) في بيانات الطالب.</p>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left-4">
           {/* بطاقات الملخص */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6"><BookOpen size={24} /></div>
                 <h4 className="text-3xl font-black">{details.lessons.length} حصة</h4>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">المنجز دراسياً</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6"><Wallet size={24} /></div>
                 <h4 className="text-3xl font-black">${selectedRecord.total_paid}</h4>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">المبلغ المسدد</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                 <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6"><CalendarDays size={24} /></div>
                 <h4 className="text-3xl font-black">${selectedRecord.remaining_balance}</h4>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">الرصيد المتبقي</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* الجدول الأسبوعي */}
              <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Clock className="text-indigo-600" /> موعد حصصي الأسبوعية</h3>
                 <div className="space-y-3">
                    {details.schedule.length > 0 ? details.schedule.map((s: any, i: number) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-transparent hover:border-slate-100 transition-all">
                         <div className="flex items-center gap-3">
                            <span className="bg-white px-3 py-1 rounded-lg font-black text-indigo-600 text-xs shadow-sm">{s.day_of_week}</span>
                            <span className="font-black text-slate-700">{s.start_time.slice(0, 5)}</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-400">{s.duration_hours} ساعة</span>
                      </div>
                    )) : <p className="text-center py-10 text-slate-300 font-bold italic text-sm">لا يوجد مواعيد مسجلة حالياً.</p>}
                 </div>
              </div>

              {/* سجل الحصص الأخيرة */}
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-3"><FileText className="text-indigo-400" /> سجل آخر الدروس</h3>
                 <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
                    {details.lessons.length > 0 ? details.lessons.map((l: any, i: number) => (
                      <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-indigo-300">{l.lesson_date}</span>
                            <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded-full">{l.hours} ساعة</span>
                         </div>
                         <p className="text-xs font-bold text-slate-400 leading-relaxed group-hover:text-white">{l.notes || 'تم شرح المحتوى المطلوب وتكليف الطالب بواجب.'}</p>
                      </div>
                    )) : <p className="text-center py-10 text-slate-500 font-bold italic text-sm">لم يتم تسجيل حصص بعد.</p>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
