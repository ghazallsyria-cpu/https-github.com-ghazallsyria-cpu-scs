
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Bell, Star, Menu, X, ShieldAlert, Key, RefreshCw, CheckCircle, Sparkles, BarChart3, Send, Radio, PhoneCall, Heart
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

const ADMIN_PHONE = '55315661';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisedTeacher, setSupervisedTeacher] = useState<{id: string, name: string} | null>(null);
  const [currentYear, setCurrentYear] = useState(localStorage.getItem('selectedYear') || '2025-2026');
  const [currentSemester, setCurrentSemester] = useState(localStorage.getItem('selectedSemester') || '1');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchProfile(s.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      setSession(ns);
      if (ns) fetchProfile(ns.user);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: any) => {
    const userPhone = user.user_metadata?.phone || '';
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      
      // إذا كان المستخدم ولي أمر (تم وسمه في تسجيل الدخول)
      if (data?.role === 'parent') {
        setProfile(data);
      } else {
        const isSystemAdmin = userPhone === ADMIN_PHONE || data?.role === 'admin';
        const role = isSystemAdmin ? 'admin' : (data?.role || 'teacher');
        setProfile({ 
          ...(data || {}), 
          id: user.id, 
          role: role, 
          is_approved: isSystemAdmin || data?.is_approved 
        });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-indigo-600 animate-pulse tracking-widest">تحميل القمة التعليمية...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const isParent = profile?.role === 'parent';
  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : (isParent ? 'parent' : 'teacher');

  const teacherNav = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "الرئيسية" },
    { to: "/schedule", icon: <Calendar size={24} />, label: "الجدول" },
    { to: "/students", icon: <Users size={24} />, label: "الطلاب" },
    { to: "/lessons", icon: <BookOpen size={24} />, label: "الحصص" },
    { to: "/payments", icon: <Wallet size={24} />, label: "المالية" },
    { to: "/statistics", icon: <BarChart3 size={24} />, label: "الإحصائيات" },
  ];

  const parentNav = [
    { to: "/", icon: <Heart size={24} />, label: "بوابة ولي الأمر" },
  ];

  const navItems = isParent ? parentNav : teacherNav;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row text-right font-['Cairo']" dir="rtl">
        
        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col sticky top-0 h-screen z-50 shadow-sm">
          <div className="p-10 flex flex-col items-center gap-4 border-b border-slate-50">
            <div className={`${isParent ? 'bg-emerald-600' : 'bg-indigo-600'} p-5 rounded-[2.2rem] text-white shadow-xl`}>
              <GraduationCap size={40} />
            </div>
            <span className="font-black text-slate-900 text-2xl">منصة القمة</span>
          </div>
          
          <nav className="flex-1 px-8 py-10 space-y-4 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? (isParent ? 'bg-emerald-600' : 'bg-indigo-600') + ' text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-slate-50 space-y-4">
                <span className="px-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">أدوات الإدارة</span>
                <NavLink to="/messaging" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? 'bg-amber-600 text-white shadow-xl' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}>
                  <Radio size={24} /> مركز البث الفوري
                </NavLink>
                <NavLink to="/teachers" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <ShieldCheck size={24} /> إدارة المعلمين
                </NavLink>
              </div>
            )}
          </nav>

          <div className="p-10 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-4 py-5 text-rose-500 font-black hover:bg-rose-50 rounded-[2rem] transition-all">
               <LogOut size={22} /> تسجيل الخروج
             </button>
          </div>
        </aside>

        {/* MOBILE NAV */}
        <nav className="lg:hidden fixed bottom-4 inset-x-4 bg-white/90 backdrop-blur-2xl border border-slate-100 flex justify-around items-center px-2 py-4 z-[100] shadow-2xl rounded-[2.5rem]">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${isActive ? (isParent ? 'text-emerald-600 bg-emerald-50' : 'text-indigo-600 bg-indigo-50') : 'text-slate-400'}`}>
              {item.icon}
              <span className="text-[9px] font-black">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* MAIN */}
        <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
          <header className="h-20 md:h-28 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between border-b border-slate-100">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                  {isParent ? 'بوابة ولي الأمر' : (isAdmin ? 'المدير العام' : 'المعلم المعتمد')}
                </span>
                <span className="text-lg md:text-xl font-black text-slate-900">{profile?.full_name}</span>
             </div>
             <div className={`${isParent ? 'bg-emerald-600' : 'bg-indigo-600'} w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white font-black shadow-lg`}>
                {profile?.full_name?.[0] || 'P'}
             </div>
          </header>

          <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full">
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <footer className="bg-white border-t border-slate-100 py-8 px-6 text-center mt-auto">
             <p className="font-black text-xs md:text-sm text-slate-400">برمجة الاستاذ ايهاب جمال غزال للإإستفسار : 55315661</p>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
