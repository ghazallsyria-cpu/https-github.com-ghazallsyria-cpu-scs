import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, ChevronLeft, Terminal, ShieldAlert, Search, Layers, Trash2 } from 'lucide-react';

const DatabaseViewer = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const scripts = [
    {
      id: 'nuclear_reset',
      title: 'كود التصفير الشامل وإعادة البناء (V15)',
      desc: 'هذا الكود يحذف كافة البيانات العشوائية والقديمة ويبني النظام من الصفر بأمان مطلق.',
      code: `-- [V15] كود التصفير الشامل وإعادة الهيكلة
DROP VIEW IF EXISTS public.student_summary_view;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'teacher',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- لتفعيل وضع المدير بعد تنفيذ الكود:
-- UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';`
    },
    {
      id: 'diagnostic',
      title: 'كاشف البيانات التشخيصي',
      desc: 'تفحص بالضبط كم سجل موجود حالياً في القاعدة.',
      code: `SELECT 'الطلاب' as "الجدول", COUNT(*) as "العدد" FROM public.students
UNION ALL
SELECT 'الحصص', COUNT(*) FROM public.lessons
UNION ALL
SELECT 'المدفوعات', COUNT(*) FROM public.payments;`
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
          <div className="p-5 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-100"><Trash2 size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">تصفير وإعادة بناء القاعدة</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">تخلص من البيانات العشوائية وابدأ من جديد</p>
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
                   <div className={`p-3 rounded-xl ${script.id === 'nuclear_reset' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {script.id === 'nuclear_reset' ? <Trash2 size={22}/> : <Search size={22}/>}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-lg">{script.title}</h4>
                      <p className="text-xs font-bold text-slate-400">{script.desc}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleCopy(script.code, script.id)}
                  className={`px-6 py-3 rounded-xl font-black text-xs flex items-center gap-3 transition-all ${copied === script.id ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-rose-600 shadow-xl'}`}
                >
                  {copied === script.id ? <><Check size={16} /> تم النسخ</> : <><Copy size={16} /> نسخ كود التصفير</>}
                </button>
             </div>

             <div className="bg-slate-900 rounded-3xl p-6 relative group border-4 border-slate-800">
                <pre className="w-full h-48 overflow-auto text-left bg-transparent text-indigo-300 font-mono text-[11px] leading-relaxed no-scrollbar selection:bg-indigo-500/30">
                  <code>{script.code}</code>
                </pre>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] flex items-start gap-6 shadow-sm">
         <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg shadow-rose-100"><ShieldAlert size={28}/></div>
         <div>
            <h4 className="font-black text-rose-900 text-lg mb-1">تنبيه حرج جداً</h4>
            <p className="text-sm font-bold text-rose-700 leading-relaxed">
               تنفيذ "كود التصفير الشامل" سيقوم بحذف كافة البيانات العشوائية والقديمة من السيرفر فوراً. لا يمكن التراجع عن هذه الخطوة بعد الضغط على Run في Supabase. تأكد من أنك تريد البدء ببيانات جديدة تماماً.
            </p>
         </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;