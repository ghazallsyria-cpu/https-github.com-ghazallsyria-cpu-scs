import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, ChevronLeft, Terminal, ShieldAlert, Search, Layers } from 'lucide-react';

const DatabaseViewer = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const scripts = [
    {
      id: 'diagnostic',
      title: 'كاشف البيانات التشخيصي (V14)',
      desc: 'انسخ هذا الكود لتفحص بالضبط كم سجل موجود في كل جدول في Supabase.',
      code: `-- كود تشخيص حالة البيانات - الإصدار الذهبي V14
-- نفذ هذا الكود في SQL Editor في Supabase
SELECT 'الطلاب (Students)' as "الجدول", COUNT(*) as "العدد الإجمالي" FROM public.students
UNION ALL
SELECT 'الحصص (Lessons)', COUNT(*) FROM public.lessons
UNION ALL
SELECT 'المدفوعات (Payments)', COUNT(*) FROM public.payments
UNION ALL
SELECT 'المستخدمين (Profiles)', COUNT(*) FROM public.profiles;`
    },
    {
      id: 'setup',
      title: 'كود التأسيس الشامل (Schema)',
      desc: 'الكود الأساسي لإنشاء الجداول والسياسات إذا كنت تبدأ من الصفر.',
      code: `-- كود تأسيس الجداول والسياسات الأساسي
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- سياسات الأمان RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access All" ON public.students FOR ALL USING (true);`
    }
  ];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-right font-['Cairo']">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100"><Database size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">مركز تشخيص البيانات</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">تأكد من سلامة ووجود سجلاتك برمجياً</p>
          </div>
        </div>
        <Link to="/teachers" className="bg-white text-slate-500 font-black px-6 py-3 rounded-xl border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-all text-xs">
          <ChevronLeft size={16} className="rotate-180" /> العودة للإدارة
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {scripts.map(script => (
          <div key={script.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                   <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                      {script.id === 'diagnostic' ? <Search size={22}/> : <Layers size={22}/>}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-lg">{script.title}</h4>
                      <p className="text-xs font-bold text-slate-400">{script.desc}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleCopy(script.code, script.id)}
                  className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-3 transition-all ${copied === script.id ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl shadow-slate-200'}`}
                >
                  {copied === script.id ? <><Check size={16} /> تم النسخ بنجاح</> : <><Copy size={16} /> نسخ الكود الآن</>}
                </button>
             </div>

             <div className="bg-slate-900 rounded-3xl p-6 relative group border-4 border-slate-800">
                <div className="flex items-center gap-2 mb-4 px-2 border-b border-white/5 pb-4">
                   <Terminal size={14} className="text-indigo-400" />
                   <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{script.id.toUpperCase()} SCRIPT MODULE</span>
                </div>
                <pre className="w-full h-48 overflow-auto text-left bg-transparent rounded-xl text-indigo-300 font-mono text-[11px] leading-relaxed no-scrollbar selection:bg-indigo-500/30">
                  <code>{script.code}</code>
                </pre>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] flex items-start gap-6 shadow-sm">
         <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg shadow-amber-100"><ShieldAlert size={28}/></div>
         <div>
            <h4 className="font-black text-amber-900 text-lg mb-1">كيف تتأكد من بياناتك؟</h4>
            <p className="text-sm font-bold text-amber-700 leading-relaxed">
               1. اذهب إلى موقع <b>Supabase</b> وافتح مشروعك.<br/>
               2. اختر أيقونة <b>SQL Editor</b> من القائمة الجانبية.<br/>
               3. انسخ "كاشف البيانات التشخيصي" من الأعلى وألصقه هناك ثم اضغط Run.<br/>
               4. ستظهر لك قائمة بالأرقام تخبرك بالضبط كم طالب وحصة موجودون في السيرفر حالياً.
            </p>
         </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;