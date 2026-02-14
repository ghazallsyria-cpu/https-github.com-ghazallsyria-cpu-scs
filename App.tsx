
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink, useLocation } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, Star, Menu, X, 
  SearchCheck, UserPlus, Copyright, Home
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
import TutorRequests from './pages/TutorRequests';
import RequestTutor from './pages/RequestTutor';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeYear, setActiveYear] = useState('2025-2026');
  const [activeSemester, setActiveSemester] = useState('1');
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) { setLoading(false); return; }
    try {
      // الأولوية لبيانات الـ JWT لتفادي أخطاء قاعدة البيانات
      const meta = user.user_metadata;
      if (meta?.role) {
        setProfile({
          id: user.id,
          full_name: meta.full_name || 'مستخدم النظام',
          role: meta.role,
          phone: meta.phone || '',
          is_approved: true
        });
      }
      
      // جلب البيانات من الجدول لتأكيد التفاصيل
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="font-black text-indigo-600 animate-pulse uppercase tracking-widest text-xs">SUMMIT V6.0 ULTIMATE</p>
    </div>
  );

  if (!session || !profile) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isTeacher = profile?.role === 'teacher';
  const isStudent = profile?.role === 'student' || profile?.role === 'parent';

  const menuItems = isAdmin ? [
    { to: "/", icon: <Home size={22} />, label: "الرئيسية" },
    { to: "/requests", icon: <SearchCheck size={22} />, label: "الطلبات" },
    { to: "/teachers", icon: <ShieldCheck size={22} />, label: "المعلمون" },
    { to: "/students", icon: <Users size={22} />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet size={22} />, label: "المالية" },
  ] : (isStudent ? [
    { to: "/", icon: <GraduationCap size={22} />, label: "بوابتي" },
    { to: "/request-tutor", icon: <UserPlus size={22} />, label: "طلب معلم" },
    { to: "/settings", icon: <SettingsIcon size={22} />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <Home size={22} />, label: "الرئيسية" },
    { to: "/students", icon: <Users size={22} />, label: "طلابي" },
    { to: "/payments", icon: <Wallet size={22} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={22} />, label: "الحصص" },
    { to: "/schedule", icon: <Calendar size={22} />, label: "الجدول" },
  ]);

  const activeProfile = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l h-screen sticky top-0 z-50 shadow-2xl">
          <div className="p-10 border-b flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg"><Star size={24} fill="white" /></div>
            <h1 className="font-black text-xl text-slate-900 leading-none">نظام القمة <br/><span className="text-[10px] text-indigo-500">VERSION 6.0</span></h1>
          </div>
          <nav className="flex-1 px-6 pt-10 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-8 border-t">
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 text-rose-500 font-black w-full px-6 py-4 hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> خروج</button>
          </div>
        </aside>

        {/* Mobile Navigation (Bottom Bar) */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-3 flex items-center justify-around">
           {menuItems.slice(0, 5).map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive ? 'text-white bg-indigo-600 shadow-lg scale-110' : 'text-slate-400'}`}>
                {item.icon}
                <span className="text-[8px] font-black">{item.label}</span>
              </NavLink>
           ))}
           <button onClick={() => supabase.auth.signOut()} className="flex flex-col items-center gap-1 p-3 text-rose-400"><LogOut size={22} /><span className="text-[8px] font-black">خروج</span></button>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-14 max-w-[1700px] mx-auto w-full pb-40">
          <header className="mb-10 flex justify-between items-center bg-white p-6 rounded-[2.5rem] border shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl">{profile.full_name[0]}</div>
                <div>
                   <h2 className="text-lg font-black text-slate-900 leading-none">{profile.full_name}</h2>
                   <p className="text-[9px] font-black text-indigo-600 uppercase mt-1 tracking-widest">{profile.role}</p>
                </div>
             </div>
             <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setActiveSemester('1')} className={`px-4 py-2 rounded-xl font-black text-[10px] ${activeSemester === '1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>فصل 1</button>
                <button onClick={() => setActiveSemester('2')} className={`px-4 py-2 rounded-xl font-black text-[10px] ${activeSemester === '2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>فصل 2</button>
             </div>
          </header>

          <Routes>
             <Route path="/" element={isStudent ? <ParentPortal parentPhone={profile.phone} /> : <Dashboard profile={activeProfile} isAdminActual={isAdmin} monitoredTeacher={monitoredTeacher} year={activeYear} semester={activeSemester} />} />
             <Route path="/students" element={<Students isAdmin={isAdmin} profile={activeProfile} year={activeYear} semester={activeSemester} />} />
             <Route path="/payments" element={<Payments role={profile.role} uid={activeProfile.id} isAdmin={isAdmin} year={activeYear} semester={activeSemester} />} />
             <Route path="/lessons" element={<Lessons role={profile.role} uid={activeProfile.id} isAdmin={isAdmin} year={activeYear} semester={activeSemester} />} />
             <Route path="/teachers" element={isAdmin ? <Teachers onMonitor={(t: any) => setMonitoredTeacher(t)} currentMonitoredId={monitoredTeacher?.id} /> : <Navigate to="/" />} />
             <Route path="/requests" element={isAdmin ? <TutorRequests /> : <Navigate to="/" />} />
             <Route path="/request-tutor" element={<RequestTutor userPhone={profile.phone} />} />
             <Route path="/schedule" element={<Schedule uid={activeProfile.id} role={profile.role} />} />
             <Route path="/settings" element={<Settings />} />
             <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <footer className="mt-20 pt-10 border-t flex flex-col items-center gap-1 opacity-50">
             <div className="flex items-center gap-2 text-indigo-600 font-black text-xs">
                <Copyright size={14} /> برمجة وتطوير : أ / ايهاب جمال غزال
             </div>
             <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">Summit Ultimate V6.0</p>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
