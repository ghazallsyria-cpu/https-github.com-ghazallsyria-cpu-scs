
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, ShieldAlert, Bell, Clock, ShieldX
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import ParentPortal from './pages/ParentPortal';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق الأولي من الجلسة
    const initSession = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s) {
        await fetchProfile(s.user);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: any) => {
    setLoading(true);
    try {
      // 1. محاولة جلب البروفايل أولاً
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      // 2. إذا لم يوجد (إما بسبب فشل التريجر أو حساب قديم)، نقوم بإنشائه يدوياً
      if (!data && !error) {
        const meta = user.user_metadata;
        const { data: newProfile, error: insError } = await supabase
          .from('profiles')
          .upsert([{
            id: user.id,
            full_name: meta?.full_name || 'مستخدم جديد',
            phone: meta?.phone || user.email?.split('@')[0],
            role: meta?.role || 'teacher',
            subjects: meta?.subjects || 'غير محدد',
            is_approved: meta?.role === 'admin' || meta?.role === 'parent' ? true : false
          }])
          .select()
          .maybeSingle();
        
        if (insError) {
          console.error("Profile Creation Error:", insError);
          // محاولة أخيرة للجلب في حال كان التريجر أسرع من الـ UPSERT
          let { data: finalAttempt } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          data = finalAttempt;
        } else {
          data = newProfile;
        }
      }
      
      setProfile(data);
    } catch (err) {
      console.error("Critical Profile Fetch Error:", err);
    } finally {
      // نضمن بقاء الـ loading فترة كافية لاستقرار الحالة
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    window.location.hash = '/';
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="font-black text-indigo-600 animate-pulse">جاري التحقق من الهوية الرقمية...</p>
    </div>
  );

  if (!session) return <Login />;

  // إذا لم يتوفر بروفايل رغم محاولات الإنشاء (مشكلة في قاعدة البيانات أو الصلاحيات)
  if (!profile) return (
    <div className="h-screen flex items-center justify-center bg-rose-50 p-6 text-center">
      <div className="max-w-md bg-white p-12 rounded-[4rem] shadow-2xl space-y-8 animate-in zoom-in">
        <ShieldX size={80} className="mx-auto text-rose-500" />
        <h2 className="text-3xl font-black text-slate-900">خلل في تهيئة الملف</h2>
        <p className="text-slate-500 font-bold leading-relaxed">
          تعذر الوصول لبياناتك الشخصية. قد يكون السبب مشكلة في صلاحيات قاعدة البيانات (RLS) أو انقطاع في الاتصال.
        </p>
        <div className="space-y-4">
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">إعادة التحميل</button>
          <button onClick={handleLogout} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">خروج والمحاولة لاحقاً</button>
        </div>
      </div>
    </div>
  );

  const isAdmin = profile.role === 'admin';
  const isParent = profile.role === 'parent';

  // شاشة الانتظار للمعلمين فقط
  if (profile.role === 'teacher' && !profile.is_approved) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
         <div className="bg-white p-12 rounded-[4rem] shadow-2xl border text-center max-w-md space-y-8">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Clock size={48} /></div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 mb-2">الحساب قيد المراجعة</h2>
               <p className="text-slate-400 font-bold">أهلاً بك {profile.full_name}. حسابك بانتظار تفعيل الإدارة لتتمكن من الوصول لكامل الصلاحيات.</p>
            </div>
            <button onClick={handleLogout} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black">تسجيل الخروج</button>
         </div>
      </div>
    );
  }

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard />, label: "لوحة الرقابة" },
    { to: "/teachers", icon: <ShieldCheck />, label: "المعلمون" },
    { to: "/students", icon: <Users />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet />, label: "المالية" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ] : (isParent ? [
    { to: "/", icon: <GraduationCap />, label: "بوابة الأبناء" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard />, label: "الرئيسية" },
    { to: "/students", icon: <Users />, label: "طلابي" },
    { to: "/lessons", icon: <BookOpen />, label: "الحصص" },
    { to: "/payments", icon: <Wallet />, label: "الحسابات" },
    { to: "/schedule", icon: <Calendar />, label: "الجدول" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-slate-200 h-screen sticky top-0 z-50">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><ShieldAlert size={28} /></div>
            <div><h1 className="font-black text-xl text-slate-900">نظام القمة</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">V4.5 GOLDEN EDITION</p></div>
          </div>
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-8 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 text-rose-500 font-black w-full px-6 py-4 hover:bg-rose-50 rounded-2xl transition-all">
              <LogOut size={20} /> خروج آمن
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="hidden lg:flex items-center justify-between px-12 h-24 bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/50">
             <div><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">المستخدم الحالي</span><span className="text-xl font-black text-slate-900 block">{profile.full_name}</span></div>
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">{profile.full_name[0]}</div>
             </div>
          </header>
          <div className="p-4 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto">
            <Routes>
               {isParent ? (
                 <Route path="/" element={<ParentPortal parentPhone={profile.phone || ''} />} />
               ) : (
                 <>
                   <Route path="/" element={<Dashboard role={profile.role} profile={profile} />} />
                   <Route path="/students" element={<Students isAdmin={isAdmin} profile={profile} />} />
                   <Route path="/lessons" element={<Lessons role={profile.role} uid={profile.id} year="2024-2025" semester="1" />} />
                   <Route path="/payments" element={<Payments role={profile.role} uid={profile.id} year="2024-2025" semester="1" />} />
                   <Route path="/schedule" element={<Schedule role={profile.role} uid={profile.id} />} />
                   {isAdmin && <Route path="/teachers" element={<Teachers />} />}
                 </>
               )}
               <Route path="/settings" element={<Settings />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
