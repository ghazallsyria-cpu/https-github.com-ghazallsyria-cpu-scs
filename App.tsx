
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink, useLocation } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, Star, CalendarDays, ShieldAlert, Clock, RefreshCw, ChevronDown, 
  Briefcase, SearchCheck, UserPlus, SlidersHorizontal, Copyright, Loader2
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
  const [retryCount, setRetryCount] = useState(0);
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);
  
  const [activeYear, setActiveYear] = useState('2025-2026');
  const [activeSemester, setActiveSemester] = useState('1');

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) { setLoading(false); return; }
    try {
      // 1. استخدام الـ Metadata الفوري لضمان الصلاحيات CRUD ومنع الـ Recursion
      const meta = user.user_metadata;
      if (meta && meta.role) {
         setProfile({
           id: user.id,
           full_name: meta.full_name || 'مستخدم النظام',
           role: meta.role,
           phone: meta.phone || '',
           is_approved: meta.role === 'admin' || meta.role === 'student' || meta.role === 'parent' ? true : (meta.is_approved || false),
           created_at: new Date().toISOString()
         });
         setLoading(false);
         return;
      }
      
      // 2. الحل الاحتياطي: جلب البيانات من الجدول
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data);
      else if (retryCount < 2) setTimeout(() => setRetryCount(prev => prev + 1), 1000);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [retryCount]);

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
    <div className="h-screen flex flex-col items-center justify-center bg-white font-['Cairo']">
      <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-[2.5rem] animate-spin mb-8"></div>
      <p className="font-black text-indigo-600 text-lg uppercase tracking-widest">تحميل نظام القمة V5.8</p>
    </div>
  );

  if (!session || !profile) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isParent = profile?.role === 'parent';
  const isStudent = profile?.role === 'student';
  const activeProfile = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/requests", icon: <SearchCheck size={20} />, label: "طلبات البحث" },
    { to: "/teachers", icon: <ShieldCheck size={20} />, label: "المعلمون" },
    { to: "/students", icon: <Users size={20} />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
  ] : (isParent || isStudent ? [
    { to: "/", icon: <GraduationCap size={20} />, label: "بوابتي" },
    { to: "/request-tutor", icon: <UserPlus size={20} />, label: "طلب معلم" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/students", icon: <Users size={20} />, label: "طلابي" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
  ]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l h-screen sticky top-0 z-50 shadow-2xl">
          <div className="p-12 border-b flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-200 rotate-3"><Star size={24} fill="white" /></div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 leading-none">نظام القمة</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase mt-1">ULTIMATE V5.8</p>
            </div>
          </div>
          
          <nav className="flex-1 px-6 pt-10 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-8 py-5 rounded-[1.8rem] font-black text-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-[-8px]' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-8 border-t flex flex-col gap-4">
             <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الفترة النشطة</p>
                <p className="font-black text-xs text-indigo-600">{activeYear} - فصل {activeSemester}</p>
             </div>
             <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 text-rose-500 font-black w-full px-8 py-5 hover:bg-rose-50 rounded-[1.8rem] transition-all"><LogOut size={20} /> خروج</button>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-14 max-w-[1700px] mx-auto w-full pb-32 overflow-y-auto">
          <header className="mb-14 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-2xl border-4 border-white">
                   {profile.full_name[0]}
                </div>
                <div>
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none mb-1">{profile.role === 'admin' ? 'مدير عام النظام' : 'عضو معتمد بالقمة'}</p>
                   <h2 className="text-2xl font-black text-slate-900">{profile.full_name}</h2>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem]">
                   <button onClick={() => setActiveSemester('1')} className={`px-6 py-3 rounded-2xl font-black text-[10px] transition-all ${activeSemester === '1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>فصل 1</button>
                   <button onClick={() => setActiveSemester('2')} className={`px-6 py-3 rounded-2xl font-black text-[10px] transition-all ${activeSemester === '2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>فصل 2</button>
                </div>
             </div>
          </header>

          <Routes>
             <Route path="/" element={isParent ? <ParentPortal parentPhone={profile.phone} /> : (isStudent ? <RequestTutor userPhone={profile.phone} /> : <Dashboard profile={activeProfile} isAdminActual={isAdmin} monitoredTeacher={monitoredTeacher} year={activeYear} semester={activeSemester} />)} />
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

          <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                <Copyright size={16} /> برمجة وتطوير : أ / ايهاب جمال غزال
             </div>
             <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em]">القمة لإدارة المحتوى التعليمي V5.8</p>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
