
import React, { useEffect, useState } from 'react';
// Fix: Import from 'react-router' instead of 'react-router-dom' to resolve missing export errors in v7 environments
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, ShieldAlert, Code2, EyeOff, CheckCircle, KeyRound, Clock, FileDown, RefreshCw
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

const cache = {
  profile: null as any,
  lastUid: null as string | null
};

const Footer: React.FC = () => (
  <footer className="mt-auto py-8 text-center border-t border-slate-100 bg-white/50 backdrop-blur-sm rounded-t-[2.5rem] lg:rounded-t-[3rem] pb-24 lg:pb-8 font-['Cairo']">
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
        <Code2 size={16} />
        <span>برمجة : ايهاب جمال غزال</span>
      </div>
      <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
        الإصدار 2.7.5 &copy; {new Date().getFullYear()}
      </div>
    </div>
  </footer>
);

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'الرئيسية' },
    { to: '/schedule', icon: <Clock size={20} />, label: 'الجدول' },
    { to: '/reports', icon: <FileDown size={20} />, label: 'التقارير' },
    { to: '/students', icon: <Users size={20} />, label: 'الطلاب' },
    { to: '/payments', icon: <Wallet size={20} />, label: 'المالية' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-2 py-3 z-[60] flex justify-around items-center rounded-t-3xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link 
            key={item.to} 
            to={item.to} 
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-sm' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-black">{item.label}</span>
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
  const [currentYear, setCurrentYear] = useState('2024-2025');
  const [currentSemester, setCurrentSemester] = useState('1');

  const fetchProfile = async (uid: string, force = false) => {
    if (!force && cache.profile && cache.lastUid === uid) {
      setProfile(cache.profile);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error;
      
      const profileData = data || { role: 'teacher', is_approved: false };
      cache.profile = profileData;
      cache.lastUid = uid;
      setProfile(profileData);
    } catch (e) {
      console.error("Profile error:", e);
      setProfile({ role: 'teacher', is_approved: false }); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession) await fetchProfile(currentSession.user.id, true);
      else setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchProfile(newSession.user.id, true);
      else {
        setProfile(null);
        cache.profile = null;
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-slate-400">جاري الدخول...</p>
    </div>
  );

  if (!session) return <Login />;

  const isApproved = profile?.is_approved === true || profile?.role === 'admin';
  
  if (!isApproved && !supervisedTeacher) {
    return <ActivationOverlay profileName={profile?.full_name} onActivated={() => fetchProfile(session.user.id, true)} />;
  }

  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = supervisedTeacher ? 'teacher' : (profile?.role || 'teacher');

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex font-['Cairo'] overflow-x-hidden">
        {supervisedTeacher && (
          <div className="fixed top-0 inset-x-0 h-10 bg-amber-500 text-white z-[100] flex items-center justify-center gap-4 px-4 shadow-lg">
            <span className="font-black text-[10px]">وضع الإشراف: {supervisedTeacher.name}</span>
            <button onClick={() => setSupervisedTeacher(null)} className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-black">إنهاء</button>
          </div>
        )}

        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200 flex-col p-8 sticky top-0 h-screen shadow-sm">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white"><GraduationCap size={28} /></div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">إدارة الدروس</h1>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="الرئيسية" />
            <NavItem to="/schedule" icon={<Clock size={20} />} label="الجدول الزمني" />
            <NavItem to="/students" icon={<Users size={20} />} label="الطلاب" />
            <NavItem to="/lessons" icon={<BookOpen size={20} />} label="سجل الدروس" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المالية" />
            <NavItem to="/reports" icon={<FileDown size={20} />} label="التقارير" />
            <NavItem to="/statistics" icon={<BarChart3 size={20} />} label="الإحصائيات" />
            {isAdmin && <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="المعلمون" />}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-8 flex items-center gap-3 px-5 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> خروج</button>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen">
          <header className={`h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 z-40 sticky top-0 ${supervisedTeacher ? 'mt-10' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <select value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} className="bg-transparent text-[10px] lg:text-xs font-black px-2 py-1 outline-none">
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
                <div className="w-px h-4 bg-slate-300"></div>
                <select value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} className="bg-transparent text-[10px] lg:text-xs font-black px-2 py-1 outline-none">
                  <option value="1">الفصل الأول</option>
                  <option value="2">الفصل الثاني</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{profile?.full_name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{isAdmin ? 'المدير' : 'معلم'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm uppercase">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-10 pb-24 lg:pb-10 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
              <Route path="/students" element={<Students role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
          </div>
          <MobileNav />
        </main>
      </div>
    </HashRouter>
  );
};

const ActivationOverlay = ({ onActivated, profileName }: any) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: funcError } = await supabase.rpc('activate_account_with_code', { provided_code: code.trim().toUpperCase() });
      if (funcError) throw funcError;
      if (data.success) {
        cache.profile = null;
        onActivated();
      } else setError(data.message);
    } catch (err: any) {
      setError("كود غير صالح أو خطأ تقني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 text-right">
      <div className="bg-white w-full max-w-lg p-10 rounded-[3.5rem] shadow-2xl">
        <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl rotate-3"><KeyRound size={40} /></div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">تنشيط الحساب</h2>
        <p className="text-slate-500 font-bold mb-8">أهلاً <span className="text-indigo-600">{profileName}</span>. أدخل كود التفعيل لتشغيل النظام.</p>
        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-100 flex gap-3"><ShieldAlert size={20} /> {error}</div>}
        <form onSubmit={handleActivate} className="space-y-6">
          <input required maxLength={8} placeholder="أدخل الكود" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-center font-black text-2xl uppercase outline-none focus:border-indigo-500 transition-all" value={code} onChange={(e) => setCode(e.target.value)} />
          <button disabled={loading || code.length < 5} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin mx-auto" size={24} /> : "تنشيط الحساب الآن"}
          </button>
          <button type="button" onClick={() => supabase.auth.signOut()} className="w-full py-4 text-slate-400 font-bold flex items-center justify-center gap-2"><LogOut size={18} /> خروج</button>
        </form>
      </div>
    </div>
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
