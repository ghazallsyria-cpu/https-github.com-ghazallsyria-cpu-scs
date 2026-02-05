import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Menu, X, Bell, UserPlus, Star
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';

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
      const isSystemAdmin = userPhone === ADMIN_PHONE || data?.role === 'admin';
      setProfile({ 
        ...(data || {}), 
        id: user.id,
        role: isSystemAdmin ? 'admin' : 'teacher',
        is_approved: isSystemAdmin || data?.is_approved
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-indigo-600 animate-pulse">جاري تحضير النظام...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : 'teacher';

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={22} />, label: "لوحة التحكم" },
    { to: "/schedule", icon: <Calendar size={22} />, label: "جدول المواعيد" },
    { to: "/students", icon: <Users size={22} />, label: "إدارة الطلاب" },
    { to: "/lessons", icon: <BookOpen size={22} />, label: "سجل الحصص" },
    { to: "/payments", icon: <Wallet size={22} />, label: "المركز المالي" },
    { to: "/reports", icon: <FileText size={22} />, label: "التقارير" },
  ];

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row text-right" dir="rtl">
        
        {/* Sidebar - Right Side */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col sticky top-0 h-screen z-50 shadow-[10px_0_30px_rgba(0,0,0,0.02)]">
          <div className="p-10 flex items-center gap-4 border-b border-slate-50/50">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <GraduationCap size={28} />
            </div>
            <div>
              <span className="font-black text-slate-900 text-xl block leading-none">نظام القمة</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">المعلم الخصوصي</span>
            </div>
          </div>
          
          <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-bold text-[13px] transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/teachers" className={({isActive}) => `flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-bold text-[13px] transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ShieldCheck size={22} /> شؤون المعلمين
              </NavLink>
            )}
          </nav>

          <div className="p-8 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-rose-500 font-black hover:bg-rose-50 transition-colors text-sm">
               <LogOut size={20} /> تسجيل الخروج
             </button>
          </div>
        </aside>

        {/* Mobile Navbar */}
        <nav className="lg:hidden fixed bottom-6 inset-x-6 bg-white/90 backdrop-blur-2xl border border-white/50 flex justify-around items-center px-4 py-4 z-[100] shadow-2xl rounded-[2.5rem]">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
              {item.icon}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/teachers" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
              <Settings size={22} />
            </NavLink>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pb-32 lg:pb-0 relative overflow-x-hidden">
          <header className="h-24 bg-white/40 backdrop-blur-xl sticky top-0 z-40 px-8 lg:px-14 flex items-center justify-between border-b border-slate-100/50">
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-3">
                <select value={currentSemester} onChange={e => { setCurrentSemester(e.target.value); localStorage.setItem('selectedSemester', e.target.value); }} className="bg-white border-2 border-slate-100 text-[11px] font-black px-6 py-2.5 rounded-2xl outline-none focus:border-indigo-600 transition-colors">
                  <option value="1">الفصل الأول</option>
                  <option value="2">الفصل الثاني</option>
                </select>
                <select value={currentYear} onChange={e => { setCurrentYear(e.target.value); localStorage.setItem('selectedYear', e.target.value); }} className="bg-white border-2 border-slate-100 text-[11px] font-black px-6 py-2.5 rounded-2xl outline-none focus:border-indigo-600 transition-colors">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div className="h-10 w-[2px] bg-slate-100 hidden md:block"></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile?.role === 'admin' ? 'المدير العام' : 'حساب معلم'}</p>
                <p className="text-base font-black text-slate-900">{profile?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button className="bg-slate-50 text-slate-400 p-3 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all relative">
                 <Bell size={20}/>
                 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
               </button>
               <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100 text-lg">
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
               </div>
            </div>
          </header>

          <div className="p-8 lg:p-14 max-w-7xl mx-auto">
            {supervisedTeacher && (
              <div className="mb-10 p-6 bg-amber-500 text-white rounded-[2rem] flex items-center justify-between shadow-2xl shadow-amber-100 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-xl"><Users size={20}/></div>
                  <span className="font-black">أنت تتصفح الآن كـ: {supervisedTeacher.name}</span>
                </div>
                <button onClick={() => setSupervisedTeacher(null)} className="bg-white text-amber-600 px-6 py-2 rounded-xl font-black text-xs hover:bg-slate-50 transition-all">إيقاف الرقابة</button>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;