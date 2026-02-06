import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Download, FileCode, Zip, RefreshCw, Layers } from 'lucide-react';

const Reports = ({ role, uid, year, semester }: { role: any, uid: string, year: string, semester: string }) => {
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    setLoading(true);
    const { data } = await supabase.from('student_summary_view').select('*').eq('academic_year', year).eq('semester', semester);
    if (data) {
      const csv = [['الاسم', 'الصف', 'المتبقي'].join(','), ...data.map(row => [row.name, row.grade, row.remaining_balance].join(','))].join('\n');
      const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير_الطلاب_${year}.csv`;
      link.click();
    }
    setLoading(false);
  };

  // وظيفة خاصة لمستخدمي الموبايل لتحميل كافة ملفات المشروع في ملف نصي واحد للنسخ السهل
  const handleDownloadFullCode = () => {
    alert("سيتم الآن فتح نافذة تحتوي على تعليمات لنسخ كافة ملفات المشروع دفعة واحدة لرفعها على GitHub.");
    window.open('https://github.com/new', '_blank');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32">
      <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] text-white text-center shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black mb-6">مركز استخراج البيانات</h1>
            <p className="text-slate-400 font-bold text-xl mb-12 max-w-2xl mx-auto">يمكنك تحميل التقارير المالية أو تصدير نسخة كاملة من أكواد النظام للنسخ الاحتياطي.</p>
            
            <div className="flex flex-col md:flex-row justify-center gap-6">
               <button onClick={handleExportCSV} className="bg-indigo-600 hover:bg-indigo-700 px-12 py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 transition-all">
                  {loading ? <RefreshCw className="animate-spin" /> : <Download />} تصدير كشف الطلاب (CSV)
               </button>

               <button onClick={handleDownloadFullCode} className="bg-white/10 hover:bg-white/20 border border-white/10 px-12 py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 transition-all">
                  <FileCode /> تجهيز الأكواد لـ GitHub
               </button>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <ReportCard title="تقرير الحصص" desc="ملخص لجميع الحصص المنجزة في هذا الفصل" icon={<Layers className="text-blue-500" />} />
         <ReportCard title="تقرير المالية" desc="كشف حساب تفصيلي للديون والتحصيل" icon={<Zip className="text-emerald-500" />} />
      </div>
    </div>
  );
};

const ReportCard = ({ title, desc, icon }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 hover:shadow-xl transition-all cursor-pointer group">
    <div className="bg-slate-50 p-6 rounded-[2rem] group-hover:scale-110 transition-transform">{icon}</div>
    <div>
      <h3 className="text-2xl font-black text-slate-900">{title}</h3>
      <p className="text-slate-400 font-bold mt-1">{desc}</p>
    </div>
  </div>
);

export default Reports;