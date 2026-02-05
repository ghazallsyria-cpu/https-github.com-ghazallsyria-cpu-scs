import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Database, Menu, X, Bell
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import DatabaseViewer from './pages/DatabaseViewer';

const ADMIN_PHONE = '55315661';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisedTeacher, setSupervisedTeacher] = useState<{id: string, name: string} | null>(null);
  const [currentYear, setCurrentYear] = useState(localStorage.getItem('selectedYear') || '2024-2025');
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
      setProfile({ 
        ...(data || {}), 
        id: user.id,
        role: (userPhone === ADMIN_PHONE || data?.role === 'admin') ? 'admin' : 'teacher',
        is_approved: userPhone === ADMIN_PHONE || data?.is_approved
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-indigo-50/30">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : 'teacher';

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
    { to: "/students", icon: <Users size={20} />, label: "الطلاب" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/reports", icon: <FileText size={20} />, label: "التقارير" },
  ];

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row-reverse text-right">
        
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-100 flex-col sticky top-0 h-screen shadow-sm z-50">
          <div className="p-8 flex items-center gap-3 border-b border-slate-50 mb-6">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100"><GraduationCap size={24} /></div>
            <span className="font-black text-slate-800 text-lg">نظام المعلم</span>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/teachers" className={({isActive}) => `flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ShieldCheck size={20} /> الإدارة
              </NavLink>
            )}
          </nav>

          <div className="p-6 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-colors">
               <LogOut size={20} /> تسجيل الخروج
             </button>
          </div>
        </aside>

        {/* Mobile Navbar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center px-2 py-3 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 opacity-60'}`}>
              {item.icon} <span className="text-[10px] font-black">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/teachers" className={({isActive}) => `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 opacity-60'}`}>
              <Settings size={20} /> <span className="text-[10px] font-black">الإدارة</span>
            </NavLink>
          )}
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-h-screen pb-24 lg:pb-0">
          <header className="h-20 bg-white/50 backdrop-blur-md sticky top-0 z-40 px-6 lg:px-12 flex items-center justify-between border-b border-slate-100/50">
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-2">
                <select value={currentSemester} onChange={e => { setCurrentSemester(e.target.value); localStorage.setItem('selectedSemester', e.target.value); }} className="bg-slate-100/50 border-none text-[11px] font-black px-4 py-2 rounded-xl outline-none">
                  <option value="1">الفصل 1</option>
                  <option value="2">الفصل 2</option>
                </select>
                <select value={currentYear} onChange={e => { setCurrentYear(e.target.value); localStorage.setItem('selectedYear', e.target.value); }} className="bg-slate-100/50 border-none text-[11px] font-black px-4 py-2 rounded-xl outline-none">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile?.role === 'admin' ? 'المدير العام' : 'مدير محتوى'}</p>
                <p className="text-sm font-black text-slate-900">{profile?.full_name}</p>
              </div>
            </div>
            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
               {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </header>

          <div className="p-6 lg:p-12 max-w-7xl mx-auto">
            {supervisedTeacher && (
              <div className="mb-8 p-4 bg-amber-500 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-amber-100 animate-pulse">
                <span className="font-black text-xs">وضع الرقابة نشط: {supervisedTeacher.name}</span>
                <button onClick={() => setSupervisedTeacher(null)} className="bg-white/20 px-4 py-1.5 rounded-xl font-black text-[10px] hover:bg-white/30 transition-all">إلغاء الرقابة</button>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} onYearChange={setCurrentYear} onSemesterChange={setCurrentSemester} />} />
              <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
              <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
              {isAdmin && <Route path="/database-viewer" element={<DatabaseViewer />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;