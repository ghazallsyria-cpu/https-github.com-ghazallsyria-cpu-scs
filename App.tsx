
import React, { useEffect, useState, useCallback } from 'react';
// Fix: Bypassing TypeScript "no exported member" errors for react-router-dom by using a dynamic import cast.
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, ShieldAlert, Clock, ShieldX, Eye, EyeOff
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
  // حالة لمراقبة معلم محدد للمدير
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setErrorStatus(null);
      } else {
        setErrorStatus("لم يتم العثور على بروفايل مرتبط.");
      }
    } catch (err: any) {
      setErrorStatus(err.message || "فشل الاتصال بنظام الصلاحيات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) {
        fetchProfile(initSession.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
      <p className="font-black text-indigo-600">جاري تحميل بروتوكولات الأمان...</p>
    </div>
  );

  if (!session) return <Login />;

  // إصلاح: لا تظهر رسالة الخطأ إلا إذا كان التحميل قد انتهى والبروفايل مفقود فعلاً
  if (errorStatus && !loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white p-12 rounded-[4rem] shadow-2xl space-y-8">
        <ShieldX size={80} className="mx-auto text-rose-500" />
        <h2 className="text-3xl font-black text-slate-900">تنبيه أمني</h2>
        <p className="text-slate-500 font-bold leading-relaxed">{errorStatus}</p>
        <button onClick={() => window.location.reload()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black">تحديث الصفحة</button>
      </div>
    </div>
  );

  if (!profile && !loading) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isParent = profile?.role === 'parent';

  // شاشة الانتظار للمعلمين غير المفعلين
  if (profile?.role === 'teacher' && !profile?.is_approved) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
         <div className="bg-white p-12 rounded-[4rem] shadow-2xl border text-center max-w-md space-y-8">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Clock size={48} /></div>
            <h2 className="text-3xl font-black text-slate-900">الحساب قيد المراجعة</h2>
            <p className="text-slate-400 font-bold">أهلاً بك {profile.full_name}. حسابك بانتظار تفعيل الإدارة.</p>
            <button onClick={handleLogout} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black">خروج</button>
         </div>
      </div>
    );
  }

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard />, label: "الرئيسية" },
    { to: "/teachers", icon: <ShieldCheck />, label: "المعلمون" },
    { to: "/students", icon: <Users />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen />, label: "الحصص" },
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

  // تحديد من هو المستخدم النشط للبيانات (نفس المعلم أو المعلم المراقب)
  const activeProfileForData = isAdmin && monitoredTeacher ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-slate-200 h-screen sticky top-0 z-50 transition-all">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-2xl text-white shadow-lg ${isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'}`}><ShieldAlert size={28} /></div>
            <div><h1 className="font-black text-xl text-slate-900 leading-none">نظام القمة</h1><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">PRO V4.5</p></div>
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="hidden lg:flex items-center justify-between px-12 h-24 bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/50">
             <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">المستخدم: {profile.full_name}</span>
                  <span className="text-xl font-black text-slate-900 block">{isAdmin ? 'لوحة المدير العام' : profile.role === 'teacher' ? 'لوحة المعلم' : 'بوابة ولي الأمر'}</span>
                </div>
                {isAdmin && monitoredTeacher && (
                  <div className="bg-amber-50 border border-amber-200 px-6 py-2 rounded-2xl flex items-center gap-4 animate-pulse">
                     <div className="flex items-center gap-2 text-amber-700 font-black text-xs">
                        <Eye size={16} /> أنت تراقب الآن: {monitoredTeacher.full_name}
                     </div>
                     <button onClick={() => setMonitoredTeacher(null)} className="text-rose-500 hover:text-rose-700 font-black text-[10px] bg-white px-3 py-1 rounded-lg border border-rose-100">إيقاف المراقبة</button>
                  </div>
                )}
             </div>
             <div className="flex items-center gap-4">
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400">حالة النظام</p>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div><span className="text-xs font-black text-slate-900">متصل الآن</span></div>
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">{profile.full_name[0]}</div>
             </div>
          </header>

          <div className="p-4 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto">
            <Routes>
               {isParent ? (
                 <Route path="/" element={<ParentPortal parentPhone={profile.phone || ''} />} />
               ) : (
                 <>
                   <Route path="/" element={<Dashboard role={profile.role} profile={activeProfileForData} isAdminActual={isAdmin} monitoredTeacher={monitoredTeacher} />} />
                   <Route path="/students" element={<Students isAdmin={isAdmin} profile={activeProfileForData} monitoredTeacher={monitoredTeacher} />} />
                   <Route path="/lessons" element={<Lessons role={profile.role} uid={activeProfileForData.id} year="2024-2025" semester="1" isAdmin={isAdmin} />} />
                   <Route path="/payments" element={<Payments role={profile.role} uid={activeProfileForData.id} year="2024-2025" semester="1" isAdmin={isAdmin} />} />
                   <Route path="/schedule" element={<Schedule role={profile.role} uid={activeProfileForData.id} />} />
                   {isAdmin && <Route path="/teachers" element={<Teachers onMonitor={(t: any) => setMonitoredTeacher(t)} currentMonitoredId={monitoredTeacher?.id} />} />}
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
