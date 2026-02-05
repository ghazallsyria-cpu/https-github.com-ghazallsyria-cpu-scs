import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, ChevronLeft, Terminal, ShieldAlert } from 'lucide-react';

const sqlCode = `-- [V11] كود الاستعادة الشامل والربط العميق بالهوية
-- انسخ هذا الكود وشغله في Supabase SQL Editor

-- 1. تصفير السياسات القديمة تماماً
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. دالة التحقق "الأمنية المطلقة"
CREATE OR REPLACE FUNCTION public.is_admin_check(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN (v_role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. الربط العميق واستعادة البيانات (Data Recovery V11)
DO $$ 
DECLARE v_current_admin_id UUID;
BEGIN
    -- الحصول على المعرف الحالي للحساب النشط بالرقم الثابت
    SELECT id INTO v_current_admin_id FROM public.profiles WHERE phone = '55315661' LIMIT 1;
    
    IF v_current_admin_id IS NOT NULL THEN
        -- نقل كافة البيانات من أي حسابات قديمة مرتبطة بنفس الرقم إلى الحساب الحالي
        UPDATE public.students SET teacher_id = v_current_admin_id 
        WHERE teacher_id IS NULL OR teacher_id IN (SELECT id FROM public.profiles WHERE phone = '55315661');

        UPDATE public.lessons SET teacher_id = v_current_admin_id 
        WHERE teacher_id IS NULL OR teacher_id IN (SELECT id FROM public.profiles WHERE phone = '55315661');

        UPDATE public.payments SET teacher_id = v_current_admin_id 
        WHERE teacher_id IS NULL OR teacher_id IN (SELECT id FROM public.profiles WHERE phone = '55315661');
    END IF;
END $$;

-- 4. إعداد السياسات المحدثة
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_all_v11" ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_admin_check(auth.uid()));

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "s_all_v11" ON public.students FOR ALL USING (auth.uid() = teacher_id OR public.is_admin_check(auth.uid()));

-- 5. ضمان صلاحية المدير
UPDATE public.profiles SET role = 'admin', is_approved = true WHERE phone = '55315661';
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
            <h1 className="text-3xl font-black text-slate-900 leading-tight">إعدادات قاعدة البيانات V11</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">الربط العميق واستعادة الهوية</p>
          </div>
        </div>
        <Link to="/teachers" className="bg-white text-slate-500 font-black px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all text-sm">
          <ChevronLeft size={16} className="rotate-180" /> العودة للإدارة
        </Link>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-xl">
         <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg"><ShieldAlert size={28}/></div>
         <div>
            <h4 className="font-black text-emerald-900 text-lg mb-1">تم التحديث للإصدار V11</h4>
            <p className="text-sm font-bold text-emerald-700 leading-relaxed">هذا الإصدار يبحث عن "البصمة الرقمية" لهاتفك في كافة السجلات القديمة ويقوم بنقلها فوراً لحسابك الجديد، حتى لو تغير المعرف البرمجي الخاص بك.</p>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-4 relative group shadow-2xl border border-slate-800">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 mb-4">
           <Terminal size={20} className="text-indigo-400" />
           <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Universal Recovery V11</span>
        </div>
        <button 
          onClick={handleCopy}
          className="absolute top-6 left-6 z-10 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-3 border border-indigo-500 hover:bg-indigo-700 transition-all shadow-xl"
        >
          {copied ? <><Check size={16} /> تم النسخ!</> : <><Copy size={16} /> نسخ كود الربط العميق</>}
        </button>
        <pre className="w-full h-[60vh] overflow-auto text-left bg-transparent p-8 rounded-2xl text-emerald-300 font-mono text-xs no-scrollbar leading-relaxed selection:bg-white/10">
          <code>{sqlCode}</code>
        </pre>
      </div>
    </div>
  );
};

export default DatabaseViewer;