
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { 
  FileDown, Calendar, Users, BookOpen, Wallet, Filter, CheckCircle, AlertCircle, 
  Download, Database, LayoutGrid, Clock, Sparkles, Terminal
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
        if (typeof val === 'object' && val !== null) val = `"${JSON.stringify(val).replace(/"/g, '""')}"`;
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
          'الاسم': s.name, 'الصف': s.grade, 'المدرسة': s.school_name || '', 'الاتفاق': s.is_hourly ? 'ساعة' : 'فصلي',
          'المبلغ المتفق عليه': s.agreed_amount, 'إجمالي الحصص': s.total_lessons, 'إجمالي المدفوع': s.total_paid, 'المتبقي': s.remaining_balance
        }));
        downloadCSV(mappedStds, `طلاب_${fileSuffix}`);
      } else if (exportType === 'lessons') {
        downloadCSV(lessonsData, `حصص_${fileSuffix}`);
      } else if (exportType === 'payments') {
        downloadCSV(paymentsData, `مدفوعات_${fileSuffix}`);
      } else {
        const summaryReport = studentsData.map(s => ({
          'اسم الطالب': s.name, 'إجمالي الحصص': s.total_lessons, 'إجمالي الساعات': s.total_hours,
          'إجمالي المدفوع': s.total_paid, 'الديون المتبقية': s.remaining_balance
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
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white animate-in slide-in-from-top-4`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-12 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" /> تصدير البيانات الذكي
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tighter mb-4">مركز التقارير <br/><span className="text-indigo-300">والتصدير الرقمي</span></h1>
          <p className="text-indigo-100/60 font-bold max-w-xl text-lg">تحكم كامل في بياناتك مع إمكانية تصديرها إلى ملفات Excel بضغطة زر.</p>
        </div>
        <FileDown className="absolute -bottom-12 -left-12 text-white/5 w-80 h-80 -rotate-12 group-hover:rotate-0 transition-transform duration-[2s]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl p-10 lg:p-12 rounded-[4rem] border border-white shadow-2xl space-y-12">
          
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
              <span className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black shadow-inner border border-indigo-200">1</span>
              اختر نوع البيانات للتصدير
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { id: 'all', label: 'تقرير شامل', icon: <Database />, desc: 'ملخص أداء جميع الطلاب' },
                { id: 'students', label: 'سجل الطلاب', icon: <Users />, desc: 'قائمة الطلاب وبياناتهم المالية' },
                { id: 'lessons', label: 'سجل الحصص', icon: <BookOpen />, desc: 'تفاصيل الحصص وتواريخها' },
                { id: 'payments', label: 'سجل الدفعات', icon: <Wallet />, desc: 'تفاصيل المبالغ المستلمة' },
              ].map((type) => (
                <button key={type.id} onClick={() => setExportType(type.id as any)} className={`p-6 rounded-[2.5rem] border-2 text-right transition-all duration-300 flex items-start gap-5 group ${exportType === type.id ? 'border-indigo-600 bg-white shadow-xl -translate-y-1' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                  <div className={`p-4 rounded-2xl transition-all duration-300 shadow-sm ${exportType === type.id ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white text-slate-400 group-hover:text-indigo-500'}`}>
                    {type.icon}
                  </div>
                  <div>
                    <p className={`font-black text-sm mb-1 ${exportType === type.id ? 'text-indigo-900' : 'text-slate-700'}`}>{type.label}</p>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
              <span className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black shadow-inner border border-indigo-200">2</span>
              حدد النطاق الزمني
            </h3>
            <div className="flex flex-wrap gap-4">
               {[
                 { id: 'daily', label: 'يومي', icon: <Clock size={14}/> },
                 { id: 'monthly', label: 'شهري', icon: <Calendar size={14}/> },
                 { id: 'semester', label: `فصلي (${semester})`, icon: <Filter size={14}/> },
                 { id: 'yearly', label: `سنوي (${year})`, icon: <LayoutGrid size={14}/> },
               ].map(range => (
                 <button key={range.id} onClick={() => setTimeRange(range.id as any)} className={`flex-1 min-w-[120px] p-4 rounded-3xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${timeRange === range.id ? 'border-indigo-600 bg-white text-indigo-600 shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
                   {range.icon}
                   {range.label}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="pt-6">
             <button disabled={loading} onClick={handleExport} className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:bg-slate-400">
               {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><Download size={24} className="group-hover:-translate-y-1 transition-transform" /> <span>تجهيز وتنزيل التقرير</span></>}
             </button>
          </div>
        </div>

        <div className="bg-slate-950 p-10 lg:p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col justify-center">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
          <div className="relative z-10">
            <h4 className="text-2xl font-black mb-8 flex items-center gap-4 text-indigo-300">
              <Terminal size={28}/>
              <span>مركز المساعدة</span>
            </h4>
            <ul className="space-y-6">
              {[
                { title: 'دعم العربية الكامل', desc: 'يتم ترميز الملفات بتقنية UTF-8 BOM لضمان ظهور الأحرف العربية بشكل سليم في Excel.'},
                { title: 'سهولة الاستخدام', desc: 'يمكنك فتح الملفات المصدرة مباشرة بأي برنامج يدعم صيغة CSV مثل Microsoft Excel أو Google Sheets.'},
                { title: 'دقة البيانات', desc: 'التقارير اليومية والشهرية تشمل فقط البيانات التي تم إدخالها خلال تلك الفترة الزمنية المحددة.'}
              ].map((info, i) => (
                <li key={i} className="border-l-4 border-indigo-700 pl-6">
                  <p className="font-black text-sm text-white mb-1">{info.title}</p>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed">{info.desc}</p>
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
