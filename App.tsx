
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, ShieldAlert, Clock, ShieldX, Eye, Menu
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
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);

  const fetchProfile = useCallback(async (user: any, retry = 0) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
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
        setLoading(false);
      } else if (retry < 1) {
        // محاولة ثانية بعد ثانية واحدة لإعطاء فرصة للـ Trigger لإنشاء الحساب
        setTimeout(() => fetchProfile(user, retry + 1), 1500);
      } else {
        // إذا لم يتم العثور على حساب بعد المحاولة الثانية، نقوم بتسجيل الخروج فوراً
        console.warn("User authenticated but no profile found. Force logging out...");
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setErrorStatus("حسابك غير مسجل في سجلات النظام أو تم حذفه. تم تسجيل الخروج.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Profile Fetch Error:", err);
      setErrorStatus(err.message || "فشل الاتصال بنظام الصلاحيات");
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
        setLoading(true);
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
      <p className="font-black text-indigo-600">جاري فحص بروتوكولات الأمان...</p>
    </div>
  );

  if (!session) return <Login />;

  if (errorStatus && !profile) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md bg-white p-12 rounded-[4rem] shadow-2xl space-y-8">
        <ShieldX size={80} className="mx-auto text-rose-500" />
        <h2 className="text-3xl font-black text-slate-900">تنبيه أمني</h2>
        <p className="text-slate-500 font-bold leading-relaxed">{errorStatus}</p>
        <button onClick={() => window.location.reload()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">العودة للرئيسية</button>
      </div>
    </div>
  );

  if (!profile) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isParent = profile?.role === 'parent';

  if (profile?.role === 'teacher' && !profile?.is_approved) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
         <div className="bg-white p-12 rounded-[4rem] shadow-2xl border text-center max-w-md space-y-8">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Clock size={48} /></div>
            <h2 className="text-3xl font-black text-slate-900">الحساب قيد المراجعة</h2>
            <p className="text-slate-400 font-bold">مرحباً {profile.full_name}. حسابك بانتظار موافقة المدير.</p>
            <button onClick={handleLogout} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black">خروج</button>
         </div>
      </div>
    );
  }

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/teachers", icon: <ShieldCheck size={20} />, label: "المعلمون" },
    { to: "/students", icon: <Users size={20} />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : (isParent ? [
    { to: "/", icon: <GraduationCap size={20} />, label: "بوابة الأبناء" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/students", icon: <Users size={20} />, label: "طلابي" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/payments", icon: <Wallet size={20} />, label: "الحسابات" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ]);

  const activeProfileForData = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-slate-200 h-screen sticky top-0 z-50">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-2xl text-white shadow-lg ${isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'}`}><ShieldAlert size={28} /></div>
            <div><h1 className="font-black text-xl text-slate-900 leading-none">نظام القمة</h1><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">SUPER ADMIN V5</p></div>
          </div>
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-8 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 text-rose-500 font-black w-full px-6 py-4 hover:bg-rose-50 rounded-2xl">
              <LogOut size={20} /> خروج آمن
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 h-20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100">
           <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white"><ShieldAlert size={20} /></div>
              <h1 className="font-black text-lg text-slate-900">نظام القمة</h1>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{profile.full_name}</span>
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-black">{profile.full_name[0]}</div>
           </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
          {/* Desktop Top Header */}
          <header className="hidden lg:flex items-center justify-between px-12 h-24 bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200">
             <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">المسؤول: {profile.full_name}</span>
                  <span className="text-xl font-black text-slate-900 block">{isAdmin ? 'لوحة التحكم العليا' : 'بوابة المستخدم'}</span>
                </div>
                {isAdmin && monitoredTeacher && (
                  <div className="bg-amber-600 text-white px-6 py-2 rounded-2xl flex items-center gap-4 animate-pulse shadow-lg">
                     <Eye size={18} />
                     <span className="text-sm font-black">وضع المراقبة: {monitoredTeacher.full_name}</span>
                     <button onClick={() => setMonitoredTeacher(null)} className="bg-white text-rose-600 px-3 py-1 rounded-xl text-[10px] font-black hover:bg-rose-50">إلغاء</button>
                  </div>
                )}
             </div>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">{profile.full_name[0]}</div>
             </div>
          </header>

          <div className="p-4 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto">
            {isAdmin && monitoredTeacher && (
               <div className="lg:hidden mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Eye size={16} className="text-amber-600" />
                     <span className="text-xs font-black text-amber-700">مراقبة: {monitoredTeacher.full_name}</span>
                  </div>
                  <button onClick={() => setMonitoredTeacher(null)} className="text-rose-600 text-xs font-black px-3 py-1 bg-white rounded-lg border border-rose-100">إنهاء</button>
               </div>
            )}
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

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-4 py-3 flex items-center justify-around z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
           {menuItems.slice(0, 5).map((item: any) => (
             <NavLink 
               key={item.to} 
               to={item.to} 
               className={({isActive}: any) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
             >
                {({isActive}: any) => (
                  <>
                    <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-inner' : ''}`}>
                       {item.icon}
                    </div>
                    <span className="text-[10px] font-black">{item.label}</span>
                  </>
                )}
             </NavLink>
           ))}
           <button 
             onClick={() => {
                window.location.hash = '#/settings';
             }}
             className="flex flex-col items-center gap-1.5 text-slate-400"
           >
              <div className="p-2 rounded-xl">
                 <SettingsIcon size={20} />
              </div>
              <span className="text-[10px] font-black">الإعدادات</span>
           </button>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;
