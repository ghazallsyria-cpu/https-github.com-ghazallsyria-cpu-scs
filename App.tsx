import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Profile } from './types';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut 
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Login from './pages/Login';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id, currentSession.user.email);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id, newSession.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string, email?: string) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (data) {
        setProfile(data);
      } else {
        // إنشاء ملف تلقائي إذا لم يوجد
        const { data: newProfile } = await supabase.from('profiles').insert([
          { id: uid, full_name: email?.split('@')[0] || 'معلم', role: 'teacher' }
        ]).select().single();
        if (newProfile) setProfile(newProfile);
      }
    } catch (e) {
      console.error("Error in profile flow:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-indigo-600 animate-pulse">جاري تحضير اللوحة...</p>
    </div>
  );

  if (!session) return <Login />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex font-['Cairo']">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white border-l border-slate-200 flex-col p-6 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">TutorTrack</h1>
          </div>
          <nav className="flex-1 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="الرئيسية" />
            <NavItem to="/students" icon={<Users size={20} />} label="الطلاب" />
            <NavItem to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المالية" />
          </nav>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="mt-auto flex items-center gap-3 px-4 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut size={20} /> خروج
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="font-black text-slate-900 lg:block hidden">لوحة التحكم</div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 leading-none">{profile?.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">معلم خصوصي</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard role={profile?.role} uid={session.user.id} />} />
              <Route path="/students" element={<Students role={profile?.role} uid={session.user.id} />} />
              <Route path="/statistics" element={<Statistics role={profile?.role} uid={session.user.id} />} />
              <Route path="/payments" element={<Payments role={profile?.role} uid={session.user.id} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
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
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
        isActive 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon} <span>{label}</span>
    </Link>
  );
};

export default App;