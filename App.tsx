
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  Home, Users, Wallet, BookOpen, Calendar, ShieldCheck, 
  SearchCheck, UserPlus, GraduationCap, Settings as SettingsIcon, Star, LogOut, Copyright, Clock
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
  const [activeYear] = useState('2025-2026');
  const [activeSemester, setActiveSemester] = useState('1');
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) { setLoading(false); return; }
    try {
      const meta = user.user_metadata;
      // تحديث فوري من الـ Metadata لضمان سرعة الاستجابة
      const initialProfile = {
        id: user.id,
        full_name: meta?.full_name || 'مستخدم النظام',
        role: meta?.role || 'student',
        phone: meta?.phone || '',
        is_approved: true
      };
      setProfile(initialProfile);

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data);
    } catch (err) { console.error("Profile Fetch Error:", err); } 
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

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="font-black text-indigo-600 text-[9px] uppercase tracking-widest animate-pulse">Summit V6.2 Ultimate</p>
    </div>
  );

  if (!session || !profile) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isStudent = profile?.role === 'student' || profile?.role === 'parent';

  const menuItems = isAdmin ? [
    { to: "/", icon: <Home size={20} />, label: "الرئيسية" },
    { to: "/requests", icon: <SearchCheck size={20} />, label: "الطلبات" },
    { to: "/teachers", icon: <ShieldCheck size={20} />, label: "المعلمون" },
    { to: "/students", icon: <Users size={20} />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
  ] : (isStudent ? [
    { to: "/", icon: <GraduationCap size={20} />, label: "بوابتي" },
    { to: "/request-tutor", icon: <UserPlus size={20} />, label: "طلب معلم" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <Home size={20} />, label: "الرئيسية" },
    { to: "/students", icon: <Users size={20} />, label: "طلابي" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
  ]);

  const activeProfile = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right overflow-x-hidden" dir="rtl">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l h-screen sticky top-0 z-50 shadow-sm">
          <div className="p-8 border-b flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100"><Star size={20} fill="white" /></div>
            <h1 className="font-black text-lg text-slate-900 leading-tight">نظام القمة <br/><span className="text-[9px] text-indigo-500 uppercase tracking-tighter">V6.2 ULTIMATE</span></h1>
          </div>
          <nav className="flex-1 px-4 pt-8 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-3 px-5 py-3.5 rounded-xl font-black text-sm transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-6 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 text-rose-500 font-black w-full px-5 py-3.5 hover:bg-rose-50 rounded-xl transition-all"><LogOut size={18} /> تسجيل الخروج</button>
          </div>
        </aside>

        {/* Mobile Navigation (Floating Bottom Bar) */}
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-[9999] bg-slate-900/95 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl p-1.5 flex items-center justify-around overflow-hidden">
           {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all flex-1 ${isActive ? 'text-white bg-indigo-600 shadow-lg' : 'text-slate-400'}`}>
                {item.icon}
                <span className="text-[7px] font-black">{item.label}</span>
              </NavLink>
           ))}
           <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-3 text-rose-400 flex-1 hover:bg-white/5 rounded-2xl transition-colors">
              <LogOut size={20} />
              <span className="text-[7px] font-black">خروج</span>
           </button>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-10 w-full pb-28 lg:pb-10">
          <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-3xl border shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg">{profile.full_name[0]}</div>
                <div className="hidden xs:block">
                   <h2 className="text-xs font-black text-slate-900 leading-none">{profile.full_name}</h2>
                   <p className="text-[8px] font-black text-indigo-600 uppercase mt-1 tracking-widest">{profile.role}</p>
                </div>
             </div>
             <div className="flex bg-slate-50 p-1 rounded-xl border">
                <button onClick={() => setActiveSemester('1')} className={`px-4 py-1.5 rounded-lg font-black text-[9px] ${activeSemester === '1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>فصل 1</button>
                <button onClick={() => setActiveSemester('2')} className={`px-4 py-1.5 rounded-lg font-black text-[9px] ${activeSemester === '2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>فصل 2</button>
             </div>
          </header>

          <div className="animate-in fade-in duration-700">
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
          </div>

          <footer className="mt-16 pt-8 border-t flex flex-col items-center gap-1 opacity-30">
             <div className="flex items-center gap-2 text-indigo-600 font-black text-[9px]">
                <Copyright size={10} /> برمجة وتطوير : أ / ايهاب جمال غزال
             </div>
             <p className="text-slate-400 font-bold text-[7px] uppercase tracking-widest">Summit Ultimate V6.2 Final</p>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
