
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, ShieldAlert, Heart, Star, LayoutGrid
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
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data);
      else await supabase.auth.signOut();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) fetchProfile(initSession.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) fetchProfile(newSession.user);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative w-24 h-24">
         <div className="absolute inset-0 border-8 border-indigo-100 rounded-[2rem] animate-pulse"></div>
         <div className="absolute inset-0 border-t-8 border-indigo-600 rounded-[2rem] animate-spin"></div>
      </div>
      <p className="mt-8 font-black text-indigo-600 tracking-tighter text-lg animate-pulse">نظام القمة الماسي V5.0</p>
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right overflow-hidden" dir="rtl">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l border-slate-100 h-screen sticky top-0 z-50 shadow-2xl shadow-slate-200/50">
          <div className="p-12 border-b border-slate-50 flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl shadow-indigo-100 rotate-3"><Star size={24} fill="white" /></div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 leading-none">نظام القمة</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">Diamond Platinum V5</p>
            </div>
          </div>
          <nav className="flex-1 p-8 space-y-3 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-8 py-5 rounded-[2rem] font-black text-sm transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-x-[-12px] scale-105' : 'text-slate-500 hover:bg-slate-50 hover:translate-x-[-4px]'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-8 space-y-4">
             <NavLink to="/settings" className="flex items-center gap-4 text-slate-400 font-black px-8 py-5 hover:bg-slate-50 rounded-[2rem] transition-all"><SettingsIcon size={20} /> الإعدادات</NavLink>
             <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 text-rose-500 font-black w-full px-8 py-5 hover:bg-rose-50 rounded-[2rem] transition-all"><LogOut size={20} /> خروج آمن</button>
          </div>
        </aside>

        {/* Navigation - Mobile (The Capsule) */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 capsule-nav px-8 py-5 flex items-center justify-between z-[1000] rounded-[3rem] shadow-2xl">
           {menuItems.slice(0, 4).map((item: any) => (
             // Fix: Added function children pattern to NavLink to correctly access isActive for conditional rendering of the indicator dot.
             <NavLink key={item.to} to={item.to} className={({isActive}: any) => `relative flex flex-col items-center transition-all ${isActive ? 'text-indigo-400 -translate-y-2 scale-125' : 'text-slate-500'}`}>
                {({ isActive }: any) => (
                  <>
                    {item.icon}
                    {isActive && <div className="absolute -bottom-2 w-1 h-1 bg-indigo-400 rounded-full"></div>}
                  </>
                )}
             </NavLink>
           ))}
           <button onClick={() => supabase.auth.signOut()} className="text-rose-400"><LogOut size={20}/></button>
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="px-8 md:px-14 h-28 flex items-center justify-between bg-white/60 backdrop-blur-2xl border-b border-slate-50 sticky top-0 z-40">
             <div className="flex items-center gap-6">
                <div className="lg:hidden bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Star size={20} fill="white" /></div>
                <div>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-60">{isAdmin ? 'المدير التنفيذي' : 'المعلم المعتمد'}</p>
                   <h2 className="text-2xl font-black text-slate-900">{profile.full_name}</h2>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="hidden md:block text-left ml-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none">حالة النظام</p>
                   <p className="text-emerald-500 font-black text-xs">متصل وآمن</p>
                </div>
                <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-xl border-4 border-white">
                   {profile.full_name[0]}
                </div>
             </div>
          </header>

          <div className="flex-1 p-6 md:p-14 max-w-[1700px] mx-auto w-full pb-32 lg:pb-14">
            <Routes>
               {isParent ? (
                 <Route path="/" element={<ParentPortal parentPhone={profile.phone || ''} />} />
               ) : (
                 <>
                   <Route path="/" element={<Dashboard role={profile.role} profile={activeProfileForData} isAdminActual={isAdmin} monitoredTeacher={monitoredTeacher} />} />
                   <Route path="/students" element={<Students isAdmin={isAdmin} profile={activeProfileForData} monitoredTeacher={monitoredTeacher} />} />
                   {/* Fix: Passed required year and semester props to the Lessons component. */}
                   <Route path="/lessons" element={<Lessons role={profile.role} uid={activeProfileForData.id} isAdmin={isAdmin} year="2024-2025" semester="1" />} />
                   <Route path="/payments" element={<Payments role={profile.role} uid={activeProfileForData.id} isAdmin={isAdmin} />} />
                   <Route path="/schedule" element={<Schedule role={profile.role} uid={activeProfileForData.id} />} />
                   {isAdmin && <Route path="/teachers" element={<Teachers onMonitor={(t: any) => setMonitoredTeacher(t)} currentMonitoredId={monitoredTeacher?.id} />} />}
                 </>
               )}
               <Route path="/settings" element={<Settings />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Platinum Footer */}
          <footer className="px-10 py-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 font-bold text-xs bg-white/30">
             <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-400" />
                <span>نظام القمة V5.0 - النسخة الماسية البلاتينية</span>
             </div>
             <div className="flex items-center gap-2">
                <span>برمجة : <span className="text-slate-900 font-black">ايهاب جمال غزال</span></span>
                <div className="w-1 h-1 bg-indigo-200 rounded-full"></div>
                <span>كافة الحقوق محفوظة &copy; 2024</span>
             </div>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
