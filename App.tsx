import React, { useEffect, useState } from 'react';
// @ts-ignore
import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, RefreshCw, Sparkles, BarChart3, Radio, School,
  Activity, ShieldAlert
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Statistics from './pages/Statistics';
import Messaging from './pages/Messaging';
import ParentPortal from './pages/ParentPortal';
import Settings from './pages/Settings';

const ADMIN_PHONE = '55315661';
const APP_VERSION = "V4.4 SUPREME";

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParentSession, setIsParentSession] = useState(false);
  
  const currentYear = localStorage.getItem('selectedYear') || '2025-2026';
  const currentSemester = localStorage.getItem('selectedSemester') || '1';

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, ns) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setIsParentSession(false);
      } else if (ns) {
        setIsParentSession(false);
        setSession(ns);
        fetchProfile(ns.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: any) => {
    try {
      let profileData = null;
      // محاولات جلب البروفايل مع دعم التحقق من رقم الهاتف مباشرة
      const userPhone = user.user_metadata?.phone || '';
      
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          profileData = data;
          break;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      
      // إذا لم يجد بروفايل في الجدول، نعتمد على ميتاداتا الهاتف مؤقتاً لضمان الدخول
      const isSystemAdmin = userPhone === ADMIN_PHONE || profileData?.role === 'admin';
      
      setProfile({ 
        ...(profileData || { full_name: user.user_metadata?.full_name }), 
        id: user.id, 
        phone: userPhone,
        role: isSystemAdmin ? 'admin' : (profileData?.role || 'teacher'), 
        is_approved: isSystemAdmin || profileData?.is_approved 
      });
    } catch (e) { 
      console.error("Profile Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('parent_session_phone');
    localStorage.removeItem('parent_student_name');
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-['Cairo']">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-indigo-900 animate-pulse text-xl">تفعيل الصلاحيات {APP_VERSION}...</p>
      </div>
    </div>
  );

  if (!session && !isParentSession) return <Login />;

  const isParent = profile?.role === 'parent';
  const isAdmin = profile?.role === 'admin';

  const navItems = isAdmin ? [
    { to: "/", icon: <Activity />, label: "الرقابة" },
    { to: "/teachers", icon: <ShieldCheck />, label: "المعلمون" },
    { to: "/students", icon: <Users />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet />, label: "المالية" },
    { to: "/statistics", icon: <BarChart3 />, label: "إحصائيات" },
    { to: "/messaging", icon: <Radio />, label: "بث" },
    { to: "/settings", icon: <SettingsIcon />, label: "الأمان" },
  ] : (isParent ? [
    { to: "/", icon: <School />, label: "المتابعة" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard />, label: "الرئيسية" },
    { to: "/schedule", icon: <Calendar />, label: "الجدول" },
    { to: "/students", icon: <Users />, label: "الطلاب" },
    { to: "/lessons", icon: <BookOpen />, label: "الحصص" },
    { to: "/payments", icon: <Wallet />, label: "المالية" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row text-right font-['Cairo']" dir="rtl">
        
        {/* SIDEBAR */}
        <aside className={`hidden lg:flex w-80 ${isAdmin ? 'bg-slate-900 border-indigo-500/10' : 'bg-white border-slate-100'} border-l flex-col sticky top-0 h-screen z-50`}>
          <div className="p-10 flex flex-col items-center gap-4 border-b border-white/5">
            <div className={`${isAdmin ? 'bg-indigo-600 shadow-indigo-500/50' : (isParent ? 'bg-emerald-600' : 'bg-indigo-600')} p-6 rounded-[2.5rem] text-white shadow-2xl transition-transform hover:scale-110`}>
              {isAdmin ? <ShieldAlert size={40} /> : (isParent ? <School size={40} /> : <GraduationCap size={40} />)}
            </div>
            <span className={`font-black text-2xl tracking-tighter ${isAdmin ? 'text-white' : 'text-slate-900'}`}>القمة التعليمية</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{APP_VERSION}</span>
          </div>
          
          <nav className="flex-1 px-8 py-10 space-y-3 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2rem] font-black text-[13px] transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-xl' : (isAdmin ? 'text-slate-500 hover:bg-white/5 hover:text-indigo-400' : 'text-slate-400 hover:bg-slate-50')}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-10 border-t border-white/5">
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-4 py-5 text-rose-500 font-black hover:bg-rose-500/10 rounded-2xl transition-all">
               <LogOut size={22} /> خروج
             </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
          <header className={`h-24 md:h-28 ${isAdmin ? 'bg-slate-900 border-white/5' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-40 px-6 md:px-12 flex items-center justify-between border-b`}>
             <div className="flex flex-col text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-indigo-400' : (isParent ? 'text-emerald-500' : 'text-indigo-500')}`}>
                  {isAdmin ? 'المدير العام' : (isParent ? 'بوابة ولي الأمر' : 'المعلم المعتمد')}
                </span>
                <span className={`text-xl md:text-2xl font-black truncate max-w-[200px] ${isAdmin ? 'text-white' : 'text-slate-900'}`}>{profile?.full_name}</span>
             </div>
             <div className={`${isAdmin ? 'bg-indigo-600' : (isParent ? 'bg-emerald-600' : 'bg-indigo-600')} w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white font-black shadow-2xl`}>
                {profile?.full_name?.[0] || 'A'}
             </div>
          </header>

          <div className="flex-1 p-4 md:p-8 lg:p-14 max-w-[1800px] mx-auto w-full pb-32">
            <Routes>
              {isParent ? (
                <Route path="/" element={<ParentPortal parentPhone={profile?.phone} />} />
              ) : (
                <>
                  <Route path="/" element={<Dashboard role={profile?.role} uid={profile?.id} year={currentYear} semester={currentSemester} />} />
                  <Route path="/students" element={<Students isAdmin={isAdmin} role={profile?.role} uid={profile?.id} year={currentYear} semester={currentSemester} />} />
                  <Route path="/payments" element={<Payments role={profile?.role} uid={profile?.id} year={currentYear} semester={currentSemester} />} />
                  <Route path="/lessons" element={<Lessons role={profile?.role} uid={profile?.id} year={currentYear} semester={currentSemester} />} />
                  <Route path="/statistics" element={<Statistics role={profile?.role} uid={profile?.id} year={currentYear} semester={currentSemester} />} />
                  <Route path="/messaging" element={isAdmin ? <Messaging /> : <Navigate to="/" />} />
                  <Route path="/schedule" element={<Schedule role={profile?.role} uid={profile?.id} />} />
                  {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={() => {}} />} />}
                </>
              )}
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <nav className={`lg:hidden fixed bottom-4 inset-x-4 ${isAdmin ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-100'} backdrop-blur-2xl border flex items-center px-4 py-3 z-[100] shadow-2xl rounded-[2.5rem] overflow-x-auto no-scrollbar gap-2`}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all px-5 py-3 rounded-[1.8rem] min-w-[75px] ${isActive ? 'text-white bg-indigo-600' : (isAdmin ? 'text-slate-500' : 'text-slate-400')}`}>
              {/* @ts-ignore */}
              {React.cloneElement(item.icon, { size: 20 })}
              <span className="text-[9px] font-black whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;