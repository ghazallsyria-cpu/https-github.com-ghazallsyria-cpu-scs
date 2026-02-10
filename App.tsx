
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, Star, CalendarDays, BarChart3
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
  
  const [activeYear, setActiveYear] = useState('2025-2026');
  const [activeSemester, setActiveSemester] = useState('1');

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
    <div className="h-screen flex flex-col items-center justify-center bg-white font-['Cairo']">
      <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-[2.5rem] animate-spin mb-8"></div>
      <p className="font-black text-indigo-600 animate-pulse text-lg tracking-widest uppercase">نظام القمة V5.2 الماسي</p>
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
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
  ]);

  const activeProfileForData = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right overflow-hidden" dir="rtl">
        
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l border-slate-100 h-screen sticky top-0 z-50 shadow-2xl">
          <div className="p-12 border-b border-slate-50 flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-200 rotate-3"><Star size={24} fill="white" /></div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 leading-none">نظام القمة</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">DIAMOND CORE V5.2</p>
            </div>
          </div>

          <div className="p-8 bg-slate-50 mx-4 my-6 rounded-[2.5rem] space-y-3 border border-slate-100">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                <CalendarDays size={14} className="text-indigo-400" /> السنة الدراسية والفصل
             </div>
             <select value={activeYear} onChange={e => setActiveYear(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-black text-xs border-none shadow-sm outline-none text-slate-700 cursor-pointer">
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
             </select>
             <div className="flex bg-white p-1.5 rounded-2xl shadow-sm">
                <button onClick={() => setActiveSemester('1')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all duration-300 ${activeSemester === '1' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>فصل 1</button>
                <button onClick={() => setActiveSemester('2')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all duration-300 ${activeSemester === '2' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>فصل 2</button>
             </div>
          </div>

          <nav className="flex-1 px-6 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-[-8px]' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-8 border-t border-slate-50 space-y-4">
             <NavLink to="/settings" className="flex items-center gap-4 text-slate-400 font-black px-8 py-4 hover:bg-slate-50 rounded-[1.5rem] transition-all duration-300"><SettingsIcon size={20} /> الإعدادات</NavLink>
             <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 text-rose-500 font-black w-full px-8 py-4 hover:bg-rose-50 rounded-[1.5rem] transition-all duration-300"><LogOut size={20} /> خروج</button>
          </div>
        </aside>

        {/* Mobile Navigation (FIXED: Supports more items with scrolling) */}
        <nav className="lg:hidden fixed bottom-6 left-4 right-4 capsule-nav px-4 py-4 flex items-center justify-around z-[1000] rounded-[3rem] shadow-2xl overflow-x-auto no-scrollbar">
           {menuItems.map((item: any) => (
             <NavLink key={item.to} to={item.to} className={({isActive}: any) => `relative flex flex-col items-center min-w-[60px] transition-all ${isActive ? 'text-indigo-400 -translate-y-2 scale-110' : 'text-slate-500'}`}>
                {({ isActive }: any) => (
                  <>
                    {item.icon}
                    <span className="text-[8px] font-black mt-1">{item.label}</span>
                    {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>}
                  </>
                )}
             </NavLink>
           ))}
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="px-8 md:px-14 h-24 flex items-center justify-between bg-white/60 backdrop-blur-2xl border-b border-slate-50 sticky top-0 z-40">
             <div className="flex items-center gap-6">
                <div className="lg:hidden bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Star size={20} fill="white" /></div>
                <div>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{isAdmin ? 'المدير العام' : 'المعلم المعتمد'}</p>
                   <h2 className="text-lg font-black text-slate-900 truncate max-w-[150px] md:max-w-none">{profile.full_name}</h2>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-emerald-100 hidden md:flex items-center gap-2 animate-pulse">
                   آمن وبحالة ممتازة
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border-4 border-white">{profile.full_name[0]}</div>
             </div>
          </header>

          <div className="flex-1 p-6 md:p-12 max-w-[1700px] mx-auto w-full pb-32 lg:pb-12">
            <Routes>
               {isParent ? (
                 <Route path="/" element={<ParentPortal parentPhone={profile.phone || ''} />} />
               ) : (
                 <>
                   <Route path="/" element={<Dashboard role={profile.role} profile={activeProfileForData} isAdminActual={isAdmin} monitoredTeacher={monitoredTeacher} year={activeYear} semester={activeSemester} />} />
                   <Route path="/students" element={<Students isAdmin={isAdmin} profile={activeProfileForData} monitoredTeacher={monitoredTeacher} year={activeYear} semester={activeSemester} />} />
                   <Route path="/lessons" element={<Lessons role={profile.role} uid={activeProfileForData.id} isAdmin={isAdmin} year={activeYear} semester={activeSemester} />} />
                   <Route path="/payments" element={<Payments role={profile.role} uid={activeProfileForData.id} isAdmin={isAdmin} year={activeYear} semester={activeSemester} />} />
                   <Route path="/schedule" element={<Schedule role={profile.role} uid={activeProfileForData.id} />} />
                   {isAdmin && <Route path="/teachers" element={<Teachers onMonitor={(t: any) => setMonitoredTeacher(t)} currentMonitoredId={monitoredTeacher?.id} />} />}
                 </>
               )}
               <Route path="/settings" element={<Settings />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <footer className="px-10 py-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center text-slate-400 font-bold text-[10px] bg-white gap-4">
             <span>نظام القمة V5.2 - النسخة الماسية المطلقة</span>
             <span>برمجة : <span className="text-slate-900 font-black">ايهاب جمال غزال</span> &copy; 2025</span>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
