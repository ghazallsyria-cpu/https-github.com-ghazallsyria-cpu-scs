import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, Code2, Clock, FileDown, Database
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

const Footer: React.FC = () => (
  <footer className="mt-auto py-12 text-center border-t border-slate-100/50 pb-28 lg:pb-12 font-['Cairo']">
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm transition-transform hover:scale-105">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Code2 size={16} /></div>
        <span className="text-slate-900 font-black text-sm">برمجة : ايهاب جمال غزال</span>
      </div>
      <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">الإصدار 7.0.0 &copy; {new Date().getFullYear()}</div>
    </div>
  </footer>
);

const NavItem = ({ to, icon, label }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 font-black text-sm group ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:translate-x-[-4px]'}`}>
      <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-600'} transition-transform`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

const MobileNav: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const location = useLocation();
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'الرئيسية' },
    { to: '/schedule', icon: <Clock size={20} />, label: 'الجدول' },
    { to: '/students', icon: <Users size={20} />, label: 'الطلاب' },
    { to: '/payments', icon: <Wallet size={20} />, label: 'المالية' },
  ];
  if (isAdmin) navItems.push({ to: '/teachers', icon: <ShieldCheck size={20} />, label: 'الإدارة' });
  else navItems.push({ to: '/reports', icon: <FileDown size={20} />, label: 'تقارير' });

  return (
    <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-2xl border border-white/40 p-2 z-[60] flex justify-around items-center rounded-[2.5rem] shadow-2xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-[1.8rem] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-lg -translate-y-1' : 'text-slate-400'}`}>
            {item.icon}
            {isActive && <span className="text-[10px] font-black">{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
};

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
      if (s) fetchProfile(s.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      setSession(ns);
      if (ns) fetchProfile(ns.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) {
        setProfile({ role: 'teacher', is_approved: false });
      } else {
        setProfile(data || { role: 'teacher', is_approved: false });
      }
    } catch (e) {
      setProfile({ role: 'teacher', is_approved: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-['Cairo']">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = supervisedTeacher ? 'teacher' : (profile?.role || 'teacher');

  return (
    <HashRouter>
      <div className="min-h-screen flex font-['Cairo'] selection:bg-indigo-100 selection:text-indigo-600">
        {supervisedTeacher && (
          <div className="fixed top-0 inset-x-0 h-11 bg-amber-600 text-white z-[100] flex items-center justify-center gap-4 px-4 shadow-xl">
             <span className="font-black text-xs">وضع الرقابة: {supervisedTeacher.name}</span>
             <button onClick={() => setSupervisedTeacher(null)} className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">إغلاق</button>
          </div>
        )}

        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col p-8 sticky top-0 h-screen">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100"><GraduationCap size={28} /></div>
            <h1 className="text-xl font-black text-slate-900">إدارة الطلاب</h1>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
            <NavItem to="/schedule" icon={<Clock size={20} />} label="الجدول" />
            <NavItem to="/students" icon={<Users size={20} />} label="الطلاب" />
            <NavItem to="/lessons" icon={<BookOpen size={20} />} label="الحصص" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المالية" />
            <NavItem to="/reports" icon={<FileDown size={20} />} label="التقارير" />
            {isAdmin && <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="الإدارة" />}
            {isAdmin && <NavItem to="/database-viewer" icon={<Database size={20} />} label="قواعد البيانات" />}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 font-black hover:bg-rose-50 transition-all">
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
          <header className={`h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 z-40 sticky top-0 ${supervisedTeacher ? 'mt-11' : ''}`}>
            <div className="flex items-center gap-4">
              <select value={currentYear} onChange={e => { setCurrentYear(e.target.value); localStorage.setItem('selectedYear', e.target.value); }} className="bg-slate-50 text-[11px] font-black px-4 py-2 rounded-xl outline-none border border-slate-100">
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
              <select value={currentSemester} onChange={e => { setCurrentSemester(e.target.value); localStorage.setItem('selectedSemester', e.target.value); }} className="bg-slate-50 text-[11px] font-black px-4 py-2 rounded-xl outline-none border border-slate-100">
                <option value="1">الفصل 1</option>
                <option value="2">الفصل 2</option>
              </select>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
              {profile?.full_name?.[0] || 'U'}
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-10">
            <Routes>
              <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
              <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
              {isAdmin && <Route path="/database-viewer" element={<DatabaseViewer />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </main>
        <MobileNav isAdmin={isAdmin} />
      </div>
    </HashRouter>
  );
};

export default App;