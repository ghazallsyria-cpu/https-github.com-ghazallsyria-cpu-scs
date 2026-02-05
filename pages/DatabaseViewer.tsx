import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, ChevronLeft, Terminal, ShieldAlert } from 'lucide-react';

const sqlCode = `-- [V7] الإصلاح الجذري النهائي لصلاحيات مدير النظام (Supabase SQL Editor)
-- انسخ هذا الكود بالكامل وشغله في Supabase لحل مشكلة الصلاحيات (RLS Infinite Recursion)

-- 1. دالة التحقق المحصنة (Security Definer) لتجاوز RLS في عملية التحقق
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. إعداد سياسات جدول الحسابات (Profiles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual read" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin managed" ON public.profiles;

-- السماح للمستخدم برؤية بياناته فور تسجيل الدخول للتعرف على هويته
CREATE POLICY "Allow individual read" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- السماح للمدير بالتحكم في كافة السجلات دون تكرار لانهائي
CREATE POLICY "Allow admin managed" ON public.profiles 
FOR ALL USING (public.is_admin_check(auth.uid()));

-- 3. ترقية رقم الهاتف المخصص ليكون مديراً فوراً (تأكد من تسجيل الحساب أولاً برقم الموبايل)
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE phone = '55315661';

-- 4. ربط بقية الجداول بنظام التحقق الجديد
DROP POLICY IF EXISTS "Students access" ON public.students;
CREATE POLICY "Students access" ON public.students FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

DROP POLICY IF EXISTS "Lessons access" ON public.lessons;
CREATE POLICY "Lessons access" ON public.lessons FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

DROP POLICY IF EXISTS "Payments access" ON public.payments;
CREATE POLICY "Payments access" ON public.payments FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

DROP POLICY IF EXISTS "Schedules access" ON public.schedules;
CREATE POLICY "Schedules access" ON public.schedules FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));
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
            <h1 className="text-3xl font-black text-slate-900 leading-tight">إعدادات قاعدة البيانات V7</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">الحل الجذري لمشكلة الصلاحيات والتكرار اللانهائي</p>
          </div>
        </div>
        <Link to="/teachers" className="bg-white text-slate-500 font-black px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
          <ChevronLeft size={16} className="rotate-180" /> العودة للإدارة
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2.5rem] flex items-start gap-6">
         <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg"><ShieldAlert size={28}/></div>
         <div>
            <h4 className="font-black text-amber-900 text-lg mb-1">خطوة هامة جداً</h4>
            <p className="text-sm font-bold text-amber-700 leading-relaxed">انسخ الكود أدناه ونفذه في <b>SQL Editor</b> داخل حسابك في Supabase لمرة واحدة فقط. هذا الكود سيقوم بإعداد القواعد الأمنية بشكل صحيح ويمنحك صلاحيات المدير الكاملة.</p>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-4 relative group shadow-2xl border border-slate-800">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 mb-4">
           <Terminal size={20} className="text-indigo-400" />
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Supabase SQL Editor Code</span>
        </div>
        <button 
          onClick={handleCopy}
          className="absolute top-6 left-6 z-10 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-3 border border-indigo-500 hover:bg-indigo-700 transition-all shadow-xl"
        >
          {copied ? <><Check size={16} /> تم النسخ!</> : <><Copy size={16} /> نسخ كود الإصلاح</>}
        </button>
        <pre className="w-full h-[60vh] overflow-auto text-left bg-transparent p-8 rounded-2xl text-emerald-300 font-mono text-xs no-scrollbar leading-relaxed selection:bg-white/10">
          <code>{sqlCode}</code>
        </pre>
      </div>
    </div>
  );
};

export default DatabaseViewer;