
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
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setLoading(false);
      } else if (retry < 1) {
        setTimeout(() => fetchProfile(user, retry + 1), 1500);
      } else {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
        setErrorStatus("حسابك غير مسجل أو تم حذفه.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorStatus(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) fetchProfile(initSession.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) { setLoading(true); fetchProfile(newSession.user); }
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
      <p className="font-black text-indigo-600 tracking-widest uppercase text-xs">Diamond System Initializing...</p>
    </div>
  );

  if (!session || !profile) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isParent = profile?.role === 'parent';

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/teachers", icon: <ShieldCheck size={20} />, label: "المعلمون" },
    { to: "/students", icon: <Users size={20} />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
  ] : (isParent ? [
    { to: "/", icon: <GraduationCap size={20} />, label: "الأبناء" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/students", icon: <Users size={20} />, label: "طلابي" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
  ]);

  const activeProfileForData = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l border-slate-100 h-screen sticky top-0 z-50">
          <div className="p-10 border-b border-slate-50 flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100"><ShieldAlert size={28} /></div>
            <div><h1 className="font-black text-2xl text-slate-900 leading-none">نظام القمة</h1><p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Diamond Edition V5</p></div>
          </div>
          <nav className="flex-1 p-8 space-y-3 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-8 py-5 rounded-[2rem] font-black text-sm transition-all ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-x-[-8px]' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-8 border-t border-slate-50">
            <button onClick={handleLogout} className="flex items-center gap-4 text-rose-500 font-black w-full px-8 py-5 hover:bg-rose-50 rounded-[2rem] transition-all"><LogOut size={20} /> خروج آمن</button>
          </div>
        </aside>

        {/* Mobile Capsule Nav */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-2xl px-6 py-4 flex items-center justify-around z-[1000] rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
           {menuItems.slice(0, 4).map((item: any) => (
             <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
                {item.icon}
             </NavLink>
           ))}
           <NavLink to="/settings" className={({isActive}: any) => `flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
              <SettingsIcon size={20} />
           </NavLink>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <header className="px-6 md:px-12 h-24 flex items-center justify-between bg-white/50 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
             <div className="flex items-center gap-6">
                <div className="lg:hidden bg-indigo-600 p-2 rounded-xl text-white"><ShieldAlert size={20} /></div>
                <div><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{profile.role === 'admin' ? 'مدير النظام' : 'بوابة المعلم'}</span><h2 className="text-xl font-black text-slate-900">{profile.full_name}</h2></div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">{profile.full_name[0]}</div>
             </div>
          </header>

          <div className="p-6 md:p-12 max-w-[1600px] mx-auto pb-32 lg:pb-12">
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
