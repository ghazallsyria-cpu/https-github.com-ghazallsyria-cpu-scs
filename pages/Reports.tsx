
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  FileDown, Calendar, Users, BookOpen, Wallet, Filter, CheckCircle, AlertCircle, 
  Download, Database, LayoutGrid, Clock
} from 'lucide-react';

const Reports = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'students' | 'lessons' | 'payments' | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'semester' | 'yearly'>('semester');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const isAdmin = role === 'admin';

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      showFeedback("لا توجد بيانات لتصديرها بناءً على الفلترة المختارة", "error");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        let val = row[header] === null || row[header] === undefined ? "" : row[header];
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback("تم تصدير الملف بنجاح");
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7);

      let studentsData: any[] = [];
      let lessonsData: any[] = [];
      let paymentsData: any[] = [];

      let qStds = supabase.from('student_summary_view').select('*');
      if (!isAdmin) qStds = qStds.eq('teacher_id', uid);
      
      if (timeRange === 'semester') qStds = qStds.eq('academic_year', year).eq('semester', semester);
      if (timeRange === 'yearly') qStds = qStds.eq('academic_year', year);
      
      const { data: stds } = await qStds;
      studentsData = stds || [];

      if (exportType === 'lessons' || exportType === 'all') {
        let qLsns = supabase.from('lessons').select('*, students(name, grade)');
        if (!isAdmin) qLsns = qLsns.eq('teacher_id', uid);
        
        if (timeRange === 'daily') qLsns = qLsns.eq('lesson_date', todayStr);
        if (timeRange === 'monthly') qLsns = qLsns.gte('lesson_date', `${monthStr}-01`).lte('lesson_date', `${monthStr}-31`);
        
        const { data: lsns } = await qLsns;
        lessonsData = (lsns || []).map(l => ({
          'التاريخ': l.lesson_date,
          'الطالب': l.students?.name,
          'الصف': l.students?.grade,
          'عدد الساعات': l.hours,
          'ملاحظات': l.notes || ''
        }));
      }

      if (exportType === 'payments' || exportType === 'all') {
        let qPays = supabase.from('payments').select('*, students(name)');
        if (!isAdmin) qPays = qPays.eq('teacher_id', uid);

        if (timeRange === 'daily') qPays = qPays.eq('payment_date', todayStr);
        if (timeRange === 'monthly') qPays = qPays.gte('payment_date', `${monthStr}-01`).lte('payment_date', `${monthStr}-31`);

        const { data: pays } = await qPays;
        paymentsData = (pays || []).map(p => ({
          'التاريخ': p.payment_date,
          'الطالب': p.students?.name,
          'المبلغ': p.amount,
          'الوسيلة': p.payment_method,
          'رقم الدفعة': p.payment_number,
          'ملاحظات': p.notes || ''
        }));
      }

      const fileSuffix = `${timeRange}_${now.getTime()}`;
      
      if (exportType === 'students') {
        const mappedStds = studentsData.map(s => ({
          'الاسم': s.name,
          'الصف': s.grade,
          'المدرسة': s.school_name || '',
          'الاتفاق': s.is_hourly ? 'ساعة' : 'فصلي',
          'المبلغ المتفق عليه': s.agreed_amount,
          'إجمالي الحصص': s.total_lessons,
          'إجمالي المدفوع': s.total_paid,
          'المتبقي': s.remaining_balance
        }));
        downloadCSV(mappedStds, `طلاب_${fileSuffix}`);
      } else if (exportType === 'lessons') {
        downloadCSV(lessonsData, `حصص_${fileSuffix}`);
      } else if (exportType === 'payments') {
        downloadCSV(paymentsData, `مدفوعات_${fileSuffix}`);
      } else {
        const summaryReport = studentsData.map(s => ({
          'اسم الطالب': s.name,
          'إجمالي الحصص': s.total_lessons,
          'إجمالي الساعات': s.total_hours,
          'إجمالي المدفوع': s.total_paid,
          'الديون المتبقية': s.remaining_balance
        }));
        downloadCSV(summaryReport, `تقرير_شامل_${fileSuffix}`);
      }

    } catch (err: any) {
      showFeedback("حدث خطأ أثناء استخراج البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-right font-['Cairo']">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"></div>
        <div className="flex items-center gap-5 relative z-10">
           <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl rotate-3">
             <FileDown size={32} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 leading-tight">مركز التقارير والتصدير</h1>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">تصدير بياناتك إلى ملفات Excel بضغطة زر</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">1</span>
                ما هي البيانات التي تريد تصديرها؟
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'students', label: 'سجل الطلاب والديون', icon: <Users />, desc: 'قائمة الطلاب مع مبالغ الاتفاق والمتبقي' },
                  { id: 'lessons', label: 'سجل الحصص المنفذة', icon: <BookOpen />, desc: 'تفاصيل كل حصة وتاريخها وملاحظاتها' },
                  { id: 'payments', label: 'سجل الدفعات المالية', icon: <Wallet />, desc: 'تفاصيل المبالغ المستلمة ووسائل الدفع' },
                  { id: 'all', label: 'تقرير الأداء الشامل', icon: <Database />, desc: 'ملخص شامل لجميع الأنشطة المالية والتعليمية' },
                ].map((type) => (
                  <button key={type.id} onClick={() => setExportType(type.id as any)} className={`p-6 rounded-[2.5rem] border-2 text-right transition-all flex items-start gap-4 group ${exportType === type.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'}`}>
                    <div className={`p-4 rounded-2xl transition-all ${exportType === type.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 group-hover:bg-indigo-100 shadow-sm'}`}>
                      {type.icon}
                    </div>
                    <div>
                      <p className={`font-black text-sm mb-1 ${exportType === type.id ? 'text-indigo-600' : 'text-slate-900'}`}>{type.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">2</span>
                حدد النطاق الزمني للتقرير
              </h3>
              <div className="flex flex-wrap gap-4">
                 {[
                   { id: 'daily', label: 'تقرير يومي (اليوم)', icon: <Clock size={16}/> },
                   { id: 'monthly', label: 'تقرير شهري (الشهر الحالي)', icon: <Calendar size={16}/> },
                   { id: 'semester', label: `تقرير فصلي (${semester})`, icon: <Filter size={16}/> },
                   { id: 'yearly', label: `تقرير سنوي (${year})`, icon: <LayoutGrid size={16}/> },
                 ].map(range => (
                   <button key={range.id} onClick={() => setTimeRange(range.id as any)} className={`flex-1 min-w-[150px] p-5 rounded-3xl border-2 font-black text-xs transition-all flex flex-col items-center gap-3 ${timeRange === range.id ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}>
                     {range.icon}
                     {range.label}
                   </button>
                 ))}
              </div>
            </div>
            <div className="pt-6">
               <button disabled={loading} onClick={handleExport} className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50">
                 {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><Download size={24}/> تجهيز وتنزيل ملف Excel الآن</>}
               </button>
            </div>
          </div>
        </div>
        <div className="space-y-8">
           <div className="bg-indigo-600 p-8 rounded-[3.5rem] text-white shadow-2xl">
              <h4 className="text-xl font-black mb-6 flex items-center gap-3"><FileDown size={24}/> معلومات التصدير</h4>
              <ul className="space-y-5">
                {["يتم ترميز الملفات بـ UTF-8 BOM لدعم اللغة العربية.", "يمكنك فتح الملفات مباشرة ببرنامج Excel.", "التصدير اليومي يشمل فقط ما تم إنجازه اليوم."].map((info, i) => (
                  <li key={i} className="flex gap-4 items-start text-xs font-bold text-indigo-100 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></div>
                    {info}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
