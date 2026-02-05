import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, ChevronLeft, Terminal, ShieldAlert } from 'lucide-react';

const sqlCode = `-- [V9] الإصدار النهائي والمصلح لسياسات الأمان
-- انسخ هذا الكود وشغله في Supabase SQL Editor لحل كافة المشاكل

-- 1. مسح كافة السياسات القديمة بدقة لتجنب الأخطاء
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. دالة التحقق المحصنة
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. تفعيل RLS على جدول الحسابات
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات جدول الحسابات
CREATE POLICY "profiles_select_v9" ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin_check(auth.uid()));

CREATE POLICY "profiles_admin_v9" ON public.profiles FOR ALL 
USING (public.is_admin_check(auth.uid()));

-- 5. ترقية حساب المدير
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';

-- 6. سياسات بقية الجداول
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_v9" ON public.students FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_v9" ON public.lessons FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_v9" ON public.payments FOR ALL 
USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_v9" ON public.schedules FOR ALL 
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
            <h1 className="text-3xl font-black text-slate-900 leading-tight">إعدادات قاعدة البيانات V9</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">الإصدار النهائي والمصلح للأعطال</p>
          </div>
        </div>
        <Link to="/teachers" className="bg-white text-slate-500 font-black px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
          <ChevronLeft size={16} className="rotate-180" /> العودة للإدارة
        </Link>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-[2.5rem] flex items-start gap-6">
         <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg"><ShieldAlert size={28}/></div>
         <div>
            <h4 className="font-black text-emerald-900 text-lg mb-1">تم حل المشكلة</h4>
            <p className="text-sm font-bold text-emerald-700 leading-relaxed">انسخ الكود أدناه ونفذه في <b>SQL Editor</b>. هذا الكود يقوم بمسح السياسات القديمة تلقائياً لتجنب خطأ "Already Exists".</p>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-4 relative group shadow-2xl border border-slate-800">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 mb-4">
           <Terminal size={20} className="text-indigo-400" />
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Corrected SQL Script</span>
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