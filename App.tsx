import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase.ts';
import { Profile } from './types.ts';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck
} from 'lucide-react';

import Dashboard from './pages/Dashboard.tsx';
import Students from './pages/Students.tsx';
import Statistics from './pages/Statistics.tsx';
import Payments from './pages/Payments.tsx';
import Login from './pages/Login.tsx';
import Teachers from './pages/Teachers.tsx';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق الأولي من الجلسة
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) await fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else {
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
        const { data: newProfile } = await supabase.from('profiles').insert([
          { id: uid, full_name: email?.split('@')[0] || 'معلم جديد', role: 'teacher' }
        ]).select().single();
        if (newProfile) setProfile(newProfile);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-indigo-600">جاري تحميل النظام...</p>
    </div>
  );

  if (!session) return <Login />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex font-['Cairo']">
        <aside className="hidden lg:flex w-64 bg-white border-l border-slate-200 flex-col p-6 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><GraduationCap size={24} /></div>
            <h1 className="text-xl font-black text-slate-900">تتبع المعلم</h1>
          </div>
          <nav className="flex-1 space-y-2">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="لوحة التحكم" active={window.location.hash === '#/'} />
            <SidebarLink to="/students" icon={<Users size={20} />} label="الطلاب" active={window.location.hash.includes('/students')} />
            <SidebarLink to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" active={window.location.hash.includes('/statistics')} />
            <SidebarLink to="/payments" icon={<Wallet size={20} />} label="المالية" active={window.location.hash.includes('/payments')} />
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-auto flex items-center gap-3 px-4 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors">
            <LogOut size={20} /> خروج
          </button>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="lg:hidden bg-indigo-600 p-1.5 rounded-lg text-white"><GraduationCap size={20} /></div>
            <div className="font-black text-slate-900 hidden lg:block">نظام إدارة الدروس</div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{profile?.role}</p>
                <p className="text-sm font-black text-slate-900">{profile?.full_name}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
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

const SidebarLink = ({ to, icon, label, active }: any) => (
  <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-600 hover:bg-indigo-50'}`}>
    {icon} <span className="font-bold">{label}</span>
  </Link>
);

export default App;