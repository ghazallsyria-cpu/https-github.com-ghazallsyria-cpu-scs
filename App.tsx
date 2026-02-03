
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Profile } from './types';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, Menu, X, ShieldAlert, Code2 
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';

const Footer: React.FC = () => (
  <footer className="mt-auto py-8 text-center border-t border-slate-100 bg-white/50 backdrop-blur-sm rounded-t-[3rem]">
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
        <Code2 size={16} />
        <span>برمجة : ايهاب جمال غزال</span>
      </div>
      <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
        الإصدار 1.0.0 &copy; {new Date().getFullYear()}
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchProfile = async (uid: string) => {
    try {
      // نستخدم استعلام بسيط جداً للتأكد من تجاوز أي مشاكل RLS
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, is_approved')
        .eq('id', uid)
        .maybeSingle();
      
      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error("Profile Fetch Error:", e);
      // حالة افتراضية في حال فشل الجلب
      setProfile({ role: 'teacher', is_approved: false }); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) {
        await fetchProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    };
    
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white font-['Cairo']">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="font-bold text-slate-600 text-lg">جاري تحميل النظام...</p>
    </div>
  );

  if (!session) return <Login />;

  if (profile && profile.role === 'teacher' && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Cairo'] text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-lg border border-slate-100">
           <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-8">
             <ShieldAlert size={48} />
           </div>
           <h1 className="text-3xl font-black text-slate-900 mb-4">حسابك قيد المراجعة</h1>
           <p className="text-slate-500 font-bold leading-relaxed mb-10">
             أهلاً بك يا <span className="text-indigo-600">{profile.full_name || 'أيها المعلم'}</span>. حسابك بانتظار موافقة الإدارة العامة لتتمكن من الوصول للوحة التحكم.
           </p>
           <button 
             onClick={() => supabase.auth.signOut()} 
             className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-rose-600 transition-all"
           >
             تسجيل الخروج
           </button>
        </div>
        <div className="mt-10"><Footer /></div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex font-['Cairo'] overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200 flex-col p-8 sticky top-0 h-screen shadow-sm">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100">
              < GraduationCap size={28} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة الدروس</h1>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="الرئيسية" />
            <NavItem to="/students" icon={<Users size={20} />} label="الطلاب" />
            <NavItem to="/lessons" icon={<BookOpen size={20} />} label="سجل الدروس" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المالية" />
            <NavItem to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" />
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-slate-100">
                <p className="text-[11px] font-black text-slate-400 uppercase px-4 mb-3">إدارة النظام</p>
                <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="المعلمون والطلبات" />
              </div>
            )}
          </nav>
          
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="mt-8 flex items-center gap-3 px-5 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all"
          >
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col h-screen">
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-40">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 bg-slate-50 rounded-xl">
                <Menu size={20} />
              </button>
              <div className="font-black text-slate-900 text-lg">
                {isAdmin ? 'الإدارة العامة' : 'لوحة تحكم المعلم'}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">{profile?.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isAdmin ? 'المدير العام' : 'معلم معتمد'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-grow">
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
            <Footer />
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
    <Link to={to} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default App;
