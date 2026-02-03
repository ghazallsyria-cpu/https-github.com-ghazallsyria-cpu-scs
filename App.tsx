import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Profile } from './types';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, Menu, X 
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) await fetchProfile(currentSession.user.id);
      else setLoading(false);
    };
    
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchProfile(newSession.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (data) setProfile(data);
      else {
        const { data: newProfile } = await supabase.from('profiles').insert([
          { id: uid, full_name: 'معلم جديد', role: 'teacher' }
        ]).select().single();
        if (newProfile) setProfile(newProfile);
      }
    } catch (e) {
      console.error("Profile Error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="font-bold text-slate-600 text-lg">تحميل نظام TutorTrack...</p>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = profile?.role === 'admin';

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex font-['Cairo'] overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200 flex-col p-8 sticky top-0 h-screen transition-all shadow-sm">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">TutorTrack</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="الرئيسية" />
            <NavItem to="/students" icon={<Users size={20} />} label="الطلاب" />
            <NavItem to="/lessons" icon={<BookOpen size={20} />} label="سجل الدروس" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المالية" />
            <NavItem to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" />
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase px-4 mb-3 tracking-widest">إدارة النظام</p>
                <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="المعلمون" />
              </div>
            )}
          </nav>
          
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="mt-8 flex items-center gap-3 px-5 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> تسجيل الخروج
          </button>
        </aside>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
        )}

        {/* Mobile Sidebar */}
        <aside className={`fixed inset-y-0 right-0 w-72 bg-white z-[60] flex flex-col p-8 transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <GraduationCap size={24} />
              </div>
              <h1 className="text-xl font-black text-slate-900">TutorTrack</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X /></button>
          </div>
          <nav className="flex-1 space-y-1" onClick={() => setMobileMenuOpen(false)}>
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="الرئيسية" />
            <NavItem to="/students" icon={<Users size={20} />} label="الطلاب" />
            <NavItem to="/lessons" icon={<BookOpen size={20} />} label="سجل الدروس" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المالية" />
            <NavItem to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" />
            {isAdmin && <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="المعلمون" />}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-auto flex items-center gap-3 px-5 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl">
            <LogOut size={20} /> خروج
          </button>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col relative h-screen overflow-hidden">
          {/* Header */}
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100">
                <Menu size={20} />
              </button>
              <div className="font-black text-slate-900 text-lg hidden sm:block">
                {isAdmin ? 'الإدارة العامة' : 'لوحة تحكم المعلم'}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden xs:block">
                <p className="text-sm font-black text-slate-900 leading-none">{profile?.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  {isAdmin ? 'المدير' : 'معلم'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 ring-4 ring-white">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 scroll-smooth">
            <div className="max-w-7xl mx-auto pb-10">
              <Routes>
                <Route path="/" element={<Dashboard role={profile?.role} uid={session.user.id} />} />
                <Route path="/students" element={<Students role={profile?.role} uid={session.user.id} />} />
                <Route path="/lessons" element={<Lessons role={profile?.role} uid={session.user.id} />} />
                <Route path="/statistics" element={<Statistics role={profile?.role} uid={session.user.id} />} />
                <Route path="/payments" element={<Payments role={profile?.role} uid={session.user.id} />} />
                {isAdmin && <Route path="/teachers" element={<Teachers />} />}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

const NavItem = ({ to, icon, label }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold ${
        isActive 
        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
};

export default App;