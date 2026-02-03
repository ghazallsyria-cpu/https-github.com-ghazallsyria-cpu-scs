import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Profile } from './types';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, Menu, GraduationCap, LogOut, ShieldCheck
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Login from './pages/Login';
import Teachers from './pages/Teachers';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
    setLoading(false);
  }

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-indigo-600">جاري التحقق من الجلسة...</div>;

  if (!session) return <Login />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']">
        <Sidebar profile={profile} />
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          <Header profile={profile} />
          <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard role={profile?.role} uid={session.user.id} />} />
              <Route path="/students" element={<Students role={profile?.role} uid={session.user.id} />} />
              <Route path="/statistics" element={<Statistics role={profile?.role} uid={session.user.id} />} />
              <Route path="/payments" element={<Payments role={profile?.role} uid={session.user.id} />} />
              {profile?.role === 'admin' && <Route path="/teachers" element={<Teachers />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

const Sidebar = ({ profile }: { profile: Profile | null }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-slate-200 transform transition-transform lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><GraduationCap size={24} /></div>
            <h1 className="text-xl font-black text-slate-900">تتبع المعلم</h1>
          </div>
          <nav className="flex-1 space-y-2">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="لوحة التحكم" active={location.pathname === '/'} />
            <SidebarLink to="/students" icon={<Users size={20} />} label="الطلاب" active={location.pathname === '/students'} />
            <SidebarLink to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" active={location.pathname === '/statistics'} />
            <SidebarLink to="/payments" icon={<Wallet size={20} />} label="المالية" active={location.pathname === '/payments'} />
            {profile?.role === 'admin' && (
              <SidebarLink to="/teachers" icon={<ShieldCheck size={20} />} label="إدارة المعلمين" active={location.pathname === '/teachers'} />
            )}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-auto flex items-center gap-3 px-4 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl">
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
};

const SidebarLink = ({ to, icon, label, active }: any) => (
  <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-indigo-50'}`}>
    {icon} <span className="font-bold">{label}</span>
  </Link>
);

const Header = ({ profile }: any) => (
  <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
    <div className="font-black text-slate-900">نظام TutorTrack Pro</div>
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs font-bold text-slate-400">{profile?.role === 'admin' ? 'المدير' : 'معلم'}</p>
        <p className="text-sm font-black text-slate-900">{profile?.full_name}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black">
        {profile?.full_name?.charAt(0)}
      </div>
    </div>
  </header>
);

export default App;