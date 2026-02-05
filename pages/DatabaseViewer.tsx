import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, ChevronLeft, Terminal, ShieldAlert } from 'lucide-react';

const sqlCode = `-- [V13] محرك الاستعادة والتطهير الشامل - الإصدار النهائي
-- هذا الكود مصمم لإعادة ربط كافة البيانات برقم الهاتف 55315661

DO $$ 
DECLARE 
    v_admin_id UUID;
    v_all_related_ids UUID[];
BEGIN
    -- 1. العثور على المعرف الحالي النشط
    SELECT id INTO v_admin_id FROM public.profiles WHERE phone = '55315661' ORDER BY created_at DESC LIMIT 1;
    
    -- 2. جمع كافة المعرفات المرتبطة بنفس الرقم
    SELECT array_agg(id) INTO v_all_related_ids FROM public.profiles WHERE phone = '55315661';

    IF v_admin_id IS NOT NULL THEN
        -- 3. الربط القسري لكل الجداول بالمعرف النشط
        UPDATE public.students SET teacher_id = v_admin_id WHERE teacher_id = ANY(v_all_related_ids) OR teacher_id IS NULL;
        UPDATE public.lessons SET teacher_id = v_admin_id WHERE teacher_id = ANY(v_all_related_ids) OR teacher_id IS NULL;
        UPDATE public.payments SET teacher_id = v_admin_id WHERE teacher_id = ANY(v_all_related_ids) OR teacher_id IS NULL;
        UPDATE public.schedules SET teacher_id = v_admin_id WHERE teacher_id = ANY(v_all_related_ids) OR teacher_id IS NULL;

        -- 4. تثبيت صلاحيات المدير
        UPDATE public.profiles SET role = 'admin', is_approved = true WHERE id = v_admin_id;
        
        -- 5. حذف الحسابات المكررة (التنظيف)
        DELETE FROM public.profiles WHERE phone = '55315661' AND id != v_admin_id;
    END IF;
END $$;

-- إعادة ضبط سياسات RLS للإصدار V13
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v12_policy" ON public.students;
CREATE POLICY "v13_policy" ON public.students FOR ALL 
USING (auth.uid() = teacher_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
`;

const DatabaseViewer = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-right font-['Cairo']">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-100"><Database size={28} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">إعدادات قاعدة البيانات V13</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">محرك الاستعادة النهائي للهوية</p>
          </div>
        </div>
        <Link to="/teachers" className="bg-white text-slate-500 font-black px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
          <ChevronLeft size={16} className="rotate-180" /> العودة للإدارة
        </Link>
      </div>

      <div className="bg-rose-50 border border-rose-200 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-xl">
         <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg"><ShieldAlert size={28}/></div>
         <div>
            <h4 className="font-black text-rose-900 text-lg mb-1">تحذير: هذا الكود سيقوم بتطهير حسابك</h4>
            <p className="text-sm font-bold text-rose-700 leading-relaxed">استخدم هذا الكود إذا ظهرت لك أسماء لا تعرفها أو اختفت بياناتك. سيقوم بربط كل شيء برقم هاتفك وحذف أي تداخلات برمجية قديمة.</p>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-4 relative group shadow-2xl border border-slate-800">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 mb-4">
           <Terminal size={20} className="text-indigo-400" />
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Master Identity Restore V13</span>
        </div>
        <button 
          onClick={handleCopy}
          className="absolute top-6 left-6 z-10 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-3 border border-indigo-500 hover:bg-indigo-700 transition-all shadow-xl"
        >
          {copied ? <><Check size={16} /> تم النسخ!</> : <><Copy size={16} /> نسخ كود الاستعادة V13</>}
        </button>
        <pre className="w-full h-[60vh] overflow-auto text-left bg-transparent p-8 rounded-2xl text-emerald-300 font-mono text-xs no-scrollbar leading-relaxed selection:bg-white/10">
          <code>{sqlCode}</code>
        </pre>
      </div>
    </div>
  );
};

export default DatabaseViewer;