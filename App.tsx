
import React, { useEffect, useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, Search, BarChart3, 
  ShieldAlert, UserCheck, Menu, X, Bell, ChevronLeft
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchProfile(s.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: any) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-black">TOP</div>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isTeacher = profile?.role === 'teacher';
  const isParent = profile?.role === 'parent';

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard />, label: "الرقابة العامة" },
    { to: "/teachers", icon: <ShieldCheck />, label: "المعلمون" },
    { to: "/students", icon: <Users />, label: "كافة الطلاب" },
    { to: "/payments", icon: <Wallet />, label: "المالية المركزية" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ] : (isParent ? [
    { to: "/", icon: <GraduationCap />, label: "بوابة الطالب" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard />, label: "الرئيسية" },
    { to: "/students", icon: <Users />, label: "طلابي" },
    { to: "/lessons", icon: <BookOpen />, label: "الحصص" },
    { to: "/payments", icon: <Wallet />, label: "الحسابات" },
    { to: "/schedule", icon: <Calendar />, label: "الجدول" },
    { to: "/settings", icon: <SettingsIcon />, label: "الإعدادات" },
  ]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-['Cairo'] text-right" dir="rtl">
        
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-slate-200 h-screen sticky top-0 shadow-sm overflow-y-auto z-50">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 tracking-tight">نظام القمة</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Edition</p>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            {menuItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-8 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 text-rose-500 font-black hover:bg-rose-50 px-6 py-4 w-full rounded-2xl transition-all">
              <LogOut size={20} /> خروج آمن
            </button>
          </div>
        </aside>

        {/* Mobile Navbar */}
        <header className="lg:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-[100]">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <ShieldAlert size={24} />
            </div>
            <span className="font-black text-lg">القمة</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="hidden lg:flex items-center justify-between px-12 h-24 bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/50">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">مرحباً بك</span>
                <span className="text-xl font-black text-slate-900">{profile?.full_name}</span>
             </div>
             <div className="flex items-center gap-6">
                <div className="relative group">
                   <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-colors">
                      <Bell size={20} />
                   </button>
                   <span className="absolute top-2 left-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-100">
                   {profile?.full_name?.[0]}
                </div>
             </div>
          </header>

          <div className="p-4 md:p-10 lg:p-12 max-w-[1600px] mx-auto w-full">
            <Routes>
               {isParent ? (
                 /* Fix: Corrected props for ParentPortal to match its definition which expects parentPhone: string */
                 <Route path="/" element={<ParentPortal parentPhone={profile?.phone || ''} />} />
               ) : (
                 <>
                   <Route path="/" element={<Dashboard role={profile?.role} profile={profile} />} />
                   <Route path="/students" element={<Students isAdmin={isAdmin} profile={profile} />} />
                   {/* Fix: Corrected props for Lessons to provide required role, uid, year, and semester instead of the whole profile */}
                   <Route path="/lessons" element={<Lessons role={profile?.role} uid={profile?.id || ''} year="2024-2025" semester="1" />} />
                   {/* Fix: Corrected props for Payments to provide required role, uid, year, and semester instead of the whole profile */}
                   <Route path="/payments" element={<Payments role={profile?.role} uid={profile?.id || ''} year="2024-2025" semester="1" />} />
                   {/* Fix: Corrected props for Schedule to provide required role and uid instead of the whole profile */}
                   <Route path="/schedule" element={<Schedule role={profile?.role} uid={profile?.id || ''} />} />
                   {/* Fix: Added mandatory onSupervise callback for Teachers component to satisfy its type definition */}
                   {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={() => {}} />} />}
                 </>
               )}
               {/* Fix: Removed profile prop from Settings as the component does not accept any props */}
               <Route path="/settings" element={<Settings />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute top-0 right-0 w-3/4 h-full bg-white shadow-2xl p-8" onClick={e => e.stopPropagation()}>
               <div className="flex items-center gap-4 mb-10 pb-6 border-b">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                   {profile?.full_name?.[0]}
                 </div>
                 <div className="flex flex-col">
                   <span className="font-black text-slate-900">{profile?.full_name}</span>
                   <span className="text-xs text-slate-400 font-bold">{profile?.role === 'admin' ? 'المدير العام' : 'المعلم المعتمد'}</span>
                 </div>
               </div>
               <nav className="space-y-2">
                  {menuItems.map(item => (
                    <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={({isActive}) => `flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-sm ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      {item.icon} {item.label}
                    </NavLink>
                  ))}
               </nav>
               <div className="mt-10 pt-6 border-t">
                  <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-5 w-full text-rose-500 font-black rounded-2xl hover:bg-rose-50">
                    <LogOut size={20} /> تسجيل الخروج
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
