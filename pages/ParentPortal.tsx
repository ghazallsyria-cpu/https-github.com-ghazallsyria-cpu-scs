
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { School, BookOpen, Wallet, RefreshCw, User, GraduationCap, CheckCircle2, CalendarDays, Clock, FileText, Star, ChevronRight } from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null); // للدخول في تفاصيل مادة معينة
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // rpc لجلب بيانات الطالب بناءً على هاتفه المسجل في حقل phones
    const { data, error } = await supabase.rpc('get_parent_dashboard', { parent_phone_val: parentPhone });
    if (error) console.error(error);
    setRecords(data || []);
    setLoading(false);
  }, [parentPhone]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const [details, setDetails] = useState<any>({ lessons: [], schedule: [], payments: [] });

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
    <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="font-black text-slate-400">جاري جلب ملفات الطالب...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-32">
      <div className="bg-slate-900 p-12 md:p-16 rounded-[4rem] text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-right">
               <h1 className="text-4xl md:text-5xl font-black mb-4">ملف <span className="text-indigo-400">الطالب</span></h1>
               <p className="text-slate-400 font-bold">متابعة شاملة للحصص، الجدول، والمدفوعات.</p>
            </div>
            {selectedRecord && (
               <button onClick={() => setSelectedRecord(null)} className="px-8 py-4 bg-white/10 rounded-2xl font-black border border-white/10 hover:bg-white/20 transition-all">العودة للرئيسية</button>
            )}
         </div>
      </div>

      {!selectedRecord ? (
        <div className="grid grid-cols-1 gap-8">
           {records.length > 0 ? records.map((r, idx) => (
             <div key={idx} onClick={() => fetchFullDetails(r)} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer overflow-hidden relative">
                <div className="flex flex-col md:flex-row items-center gap-8">
                   <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">{r.student_name[0]}</div>
                   <div className="text-center md:text-right flex-1">
                      <h3 className="text-3xl font-black text-slate-900 mb-2">{r.student_name}</h3>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                         <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><BookOpen size={16} /> {r.teacher_subjects}</span>
                         <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2"><User size={16} /> المعلم: {r.teacher_name}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase">الحصص</p>
                         <p className="text-2xl font-black text-slate-900">{r.total_lessons}</p>
                      </div>
                      <div className="w-px h-10 bg-slate-100"></div>
                      <div className="text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase">المتبقي</p>
                         <p className={`text-2xl font-black ${r.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${r.remaining_balance}</p>
                      </div>
                   </div>
                </div>
                <div className="absolute top-1/2 left-10 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all -translate-x-10 group-hover:translate-x-0">
                   <ChevronRight className="text-indigo-600 rotate-180" size={48} />
                </div>
             </div>
           )) : (
             <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100">
                <User size={60} className="mx-auto text-slate-100 mb-6" />
                <h3 className="text-2xl font-black text-slate-900">لا يوجد بيانات مرتبطة</h3>
                <p className="text-slate-400 font-bold mt-2">يرجى التأكد من أن المعلم أضاف هاتفك ({parentPhone}) في بيانات الطالب.</p>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-left-8">
           {/* نظرة سريعة */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
                 <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><BookOpen size={28} /></div>
                 <h4 className="text-3xl font-black">{details.lessons.length} حصة</h4>
                 <p className="text-slate-400 font-bold">إجمالي الدروس المنجزة</p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
                 <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Wallet size={28} /></div>
                 <h4 className="text-3xl font-black">${selectedRecord.total_paid}</h4>
                 <p className="text-slate-400 font-bold">إجمالي المبلغ المسدد</p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
                 <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6"><CalendarDays size={28} /></div>
                 <h4 className="text-3xl font-black">${selectedRecord.remaining_balance}</h4>
                 <p className="text-slate-400 font-bold">الرصيد المتبقي للتحصيل</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* جدول المواعيد الأسبوعي */}
              <div className="bg-white p-10 rounded-[4rem] border shadow-sm">
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-4"><Clock className="text-indigo-600" /> الجدول الأسبوعي</h3>
                 <div className="space-y-4">
                    {details.schedule.length > 0 ? details.schedule.map((s: any, i: number) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-[2rem] flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="bg-white px-4 py-2 rounded-xl font-black text-indigo-600 shadow-sm">{s.day_of_week}</div>
                            <span className="font-black text-slate-700">{s.start_time.slice(0, 5)}</span>
                         </div>
                         <span className="text-xs font-bold text-slate-400">المدة: {s.duration_hours} ساعة</span>
                      </div>
                    )) : <p className="text-center py-10 text-slate-300 font-bold italic">لا يوجد جدول حصص مسجل حالياً.</p>}
                 </div>
              </div>

              {/* سجل الدروس الأخيرة */}
              <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl">
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-4"><FileText className="text-indigo-400" /> سجل آخر الدروس</h3>
                 <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                    {details.lessons.length > 0 ? details.lessons.map((l: any, i: number) => (
                      <div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-indigo-300">{l.lesson_date}</span>
                            <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full">{l.hours} ساعة</span>
                         </div>
                         <p className="text-sm font-bold text-slate-400">{l.notes || 'تمت الحصة بنجاح.'}</p>
                      </div>
                    )) : <p className="text-center py-10 text-slate-500 font-bold italic">لا يوجد سجل دروس مسجل بعد.</p>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
