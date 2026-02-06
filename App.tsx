
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, ShieldAlert, Clock, ShieldX, RefreshCcw, WifiOff
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
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // جلب البيانات مع معالجة مباشرة للخطأ
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // إذا كان الخطأ هو التكرار اللانهائي، نقوم بتوضيح ذلك للمستخدم بشكل فني
        if (error.message?.includes('recursion')) {
          throw new Error("حدث تكرار في سياسات الأمان (Recursion). يرجى تطبيق كود SQL المحدث.");
        }
        throw error;
      }

      if (data) {
        setProfile(data);
        setErrorStatus(null);
      } else {
        // محاولة الإنشاء التلقائي (Self-Healing) في حال عدم وجود بروفايل
        const meta = user.user_metadata;
        const { data: newProfile, error: insError } = await supabase
          .from('profiles')
          .upsert([{
            id: user.id,
            full_name: meta?.full_name || 'مستخدم جديد',
            phone: meta?.phone || user.email?.split('@')[0],
            role: meta?.role || 'teacher',
            subjects: meta?.subjects || 'غير محدد',
            is_approved: meta?.role === 'admin' || meta?.role === 'parent'
          }])
          .select()
          .maybeSingle();

        if (insError) throw insError;
        setProfile(newProfile);
      }
    } catch (err: any) {
      console.error("Critical Auth Error:", err);
      setErrorStatus(err.message || "تعذر الاتصال بخادم البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      const { data: { session: initSession } } = await supabase.auth.getSession();
      
      if (mounted) {
        setSession(initSession);
        if (initSession?.user) {
          await fetchProfile(initSession.user);
        } else {
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession?.user) {
          setLoading(true);
          fetchProfile(newSession.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
           <ShieldAlert size={32} className="animate-pulse" />
        </div>
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">تأمين الجلسة الرقمية</h2>
      <p className="text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">جاري استدعاء بروتوكولات الأمان والمزامنة مع السحابة...</p>
    </div>
  );

  if (!session) return <Login />;

  if (errorStatus || !profile) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white p-12 rounded-[4rem] shadow-2xl border border-rose-100 space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
           <WifiOff size={48} />
        </div>
        <div>
           <h2 className="text-3xl font-black text-slate-900 mb-3">عذراً، حدث خطأ فني</h2>
           <p className="text-slate-500 font-bold leading-relaxed">
             {errorStatus || "حدث خطأ غير متوقع أثناء تهيئة بياناتك."}
           </p>
        </div>
        <div className="space-y-4">
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
             <RefreshCcw size={20} /> إعادة المحاولة
          </button>
          <button onClick={handleLogout} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
             تسجيل الخروج
          </button>
        </div>
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">ERROR_CODE: RLS_RECURSION_FIXED</p>
      </div>
    </div>
  );

  const isAdmin = profile.role === 'admin';
  const isParent = profile.role === 'parent';

  if (profile.role === 'teacher' && !profile.is_approved) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
         <div className="bg-white p-12 rounded-[4rem] shadow-2xl border text-center max-w-md space-y-8 animate-in fade-in">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Clock size={48} /></div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 mb-2">الحساب تحت المراجعة</h2>
               <p className="text-slate-400 font-bold">أهلاً بك {profile.full_name}. حسابك بانتظار تفعيل الإدارة قبل التمكن من الوصول للوحة التحكم.</p>
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
            <div><h1 className="font-black text-xl text-slate-900 leading-none">نظام القمة</h1><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">GOLDEN V4.5</p></div>
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
             <div><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">المستخدم: {isAdmin ? 'إدارة عليا' : (isParent ? 'ولي أمر' : 'معلم')}</span><span className="text-xl font-black text-slate-900 block">{profile.full_name}</span></div>
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
