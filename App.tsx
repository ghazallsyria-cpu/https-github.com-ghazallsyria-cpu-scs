

import React, { useEffect, useState } from 'react';
// @ts-ignore - Resolving module 'react-router-dom' has no exported member errors in this environment
import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
// @ts-ignore
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, RefreshCw, CheckCircle, Sparkles, BarChart3, Radio, School,
  Activity, Database, ShieldAlert, History as LucideHistory
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import Statistics from './pages/Statistics';
import Messaging from './pages/Messaging';
import ParentPortal from './pages/ParentPortal';
import Settings from './pages/Settings';

const ADMIN_PHONE = '55315661';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParentSession, setIsParentSession] = useState(false);
  const [supervisedTeacher, setSupervisedTeacher] = useState<{id: string, name: string} | null>(null);
  const [currentYear] = useState(localStorage.getItem('selectedYear') || '2025-2026');
  const [currentSemester] = useState(localStorage.getItem('selectedSemester') || '1');

  useEffect(() => {
    const parentPhone = localStorage.getItem('parent_session_phone');
    if (parentPhone) {
      setIsParentSession(true);
      setProfile({
        full_name: localStorage.getItem('parent_student_name') || 'ولي أمر',
        phone: parentPhone,
        role: 'parent',
        is_approved: true
      });
      setLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        if (s) fetchProfile(s.user);
        else setLoading(false);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      if (!ns && !localStorage.getItem('parent_session_phone')) {
        setSession(null);
        setProfile(null);
        setIsParentSession(false);
        setLoading(false);
      } else if (ns) {
        setIsParentSession(false);
        setSession(ns);
        fetchProfile(ns.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: any) => {
    const userPhone = user.user_metadata?.phone || '';
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const isSystemAdmin = userPhone === ADMIN_PHONE || data?.role === 'admin';
      const role = isSystemAdmin ? 'admin' : (data?.role || 'teacher');
      setProfile({ 
        ...(data || {}), 
        id: user.id, 
        role: role, 
        is_approved: isSystemAdmin || data?.is_approved 
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    localStorage.removeItem('parent_session_phone');
    localStorage.removeItem('parent_student_name');
    localStorage.removeItem('lastSelectedStudent');
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-['Cairo']">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-indigo-900 animate-pulse text-xl tracking-tighter">جاري تهيئة مركز القيادة...</p>
      </div>
    </div>
  );

  if (!session && !isParentSession) return <Login />;

  const isParent = profile?.role === 'parent' || isParentSession;
  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : (session?.user?.id);
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : (isParent ? 'parent' : 'teacher');

  const adminNav = [
    { to: "/", icon: <Activity size={24} />, label: "مركز الرقابة" },
    { to: "/teachers", icon: <ShieldCheck size={24} />, label: "إدارة المعلمين" },
    { to: "/students", icon: <Users size={24} />, label: "قاعدة الطلاب" },
    { to: "/payments", icon: <Wallet size={24} />, label: "الميزانية العامة" },
    { to: "/statistics", icon: <BarChart3 size={24} />, label: "إحصائيات القمة" },
    { to: "/messaging", icon: <Radio size={24} />, label: "بث إداري" },
    { to: "/settings", icon: <SettingsIcon size={24} />, label: "الأمان" },
  ];

  const teacherNav = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "الرئيسية" },
    { to: "/schedule", icon: <Calendar size={24} />, label: "جدولي" },
    { to: "/students", icon: <Users size={24} />, label: "طلابي" },
    { to: "/lessons", icon: <BookOpen size={24} />, label: "الحصص" },
    { to: "/payments", icon: <Wallet size={24} />, label: "المالية" },
    { to: "/settings", icon: <SettingsIcon size={24} />, label: "الإعدادات" },
  ];

  const parentNav = [
    { to: "/", icon: <School size={24} />, label: "بوابة المتابعة" },
    { to: "/settings", icon: <SettingsIcon size={24} />, label: "الإعدادات" },
  ];

  const currentNav = isAdmin ? adminNav : (isParent ? parentNav : teacherNav);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row text-right font-['Cairo']" dir="rtl">
        
        {/* SIDEBAR (Desktop) */}
        <aside className={`hidden lg:flex w-80 ${isAdmin ? 'bg-slate-900 border-indigo-500/10' : 'bg-white border-slate-100'} border-l flex-col sticky top-0 h-screen z-50 shadow-2xl`}>
          <div className="p-10 flex flex-col items-center gap-4 border-b border-white/5">
            <div className={`${isAdmin ? 'bg-indigo-600 shadow-indigo-500/50' : (isParent ? 'bg-emerald-600' : 'bg-indigo-600')} p-6 rounded-[2.5rem] text-white shadow-2xl transition-transform hover:scale-105`}>
              {isAdmin ? <ShieldAlert size={40} /> : (isParent ? <School size={40} /> : <GraduationCap size={40} />)}
            </div>
            <span className={`font-black text-2xl tracking-tighter ${isAdmin ? 'text-white' : 'text-slate-900'}`}>القمة التعليمية</span>
            {isAdmin && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">المدير العام</span>}
          </div>
          
          <nav className="flex-1 px-8 py-10 space-y-3 overflow-y-auto no-scrollbar">
            {currentNav.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2rem] font-black text-[13px] transition-all duration-300 ${isActive ? (isAdmin ? 'bg-indigo-600 text-white shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)]' : 'bg-indigo-600 text-white shadow-xl') : (isAdmin ? 'text-slate-500 hover:bg-white/5 hover:text-indigo-400' : 'text-slate-400 hover:bg-slate-50')}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-10 border-t border-white/5">
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-4 py-5 text-rose-500 font-black hover:bg-rose-500/10 rounded-2xl transition-all">
               <LogOut size={22} /> تسجيل الخروج
             </button>
          </div>
        </aside>

        {/* MOBILE NAV (Bottom) */}
        <nav className={`lg:hidden fixed bottom-4 inset-x-4 ${isAdmin ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-100'} backdrop-blur-2xl border flex items-center px-4 py-3 z-[100] shadow-2xl rounded-[2.5rem] overflow-x-auto no-scrollbar gap-2`}>
          {currentNav.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all px-5 py-3 rounded-[1.8rem] min-w-[75px] ${isActive ? (isAdmin ? 'text-white bg-indigo-600' : 'text-white bg-indigo-600') : (isAdmin ? 'text-slate-500' : 'text-slate-400')}`}>
              {/* @ts-ignore - Fixing "size" prop error on unknown type by casting item.icon to ReactElement<any> */}
              {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
              <span className="text-[9px] font-black whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 px-5 py-3 text-rose-500 min-w-[75px]">
            <LogOut size={20} />
            <span className="text-[9px] font-black">خروج</span>
          </button>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
          <header className={`h-24 md:h-28 ${isAdmin ? 'bg-slate-900 border-white/5' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-40 px-6 md:px-12 flex items-center justify-between border-b`}>
             <div className="flex flex-col text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-indigo-400' : (isParent ? 'text-emerald-500' : 'text-indigo-500')}`}>
                  {isAdmin ? 'الإدارة المركزية' : (isParent ? 'بوابة ولي الأمر' : 'المعلم المعتمد')}
                </span>
                <span className={`text-xl md:text-2xl font-black truncate max-w-[200px] ${isAdmin ? 'text-white' : 'text-slate-900'}`}>{profile?.full_name}</span>
             </div>
             
             <div className="flex items-center gap-6">
                <div className={`${isAdmin ? 'bg-indigo-600' : (isParent ? 'bg-emerald-600' : 'bg-indigo-600')} w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white font-black shadow-2xl`}>
                    {profile?.full_name?.[0] || 'A'}
                </div>
             </div>
          </header>

          <div className="flex-1 p-4 md:p-8 lg:p-14 max-w-[1800px] mx-auto w-full pb-32 lg:pb-16">
            <Routes>
              {isParent ? (
                <Route path="/" element={<ParentPortal parentPhone={profile?.phone} />} />
              ) : (
                <>
                  <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                  <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                  <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                  <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                  <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                  <Route path="/messaging" element={isAdmin ? <Messaging /> : <Navigate to="/" />} />
                  <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
                  <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                  {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
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
