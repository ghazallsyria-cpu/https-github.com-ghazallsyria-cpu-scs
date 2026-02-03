
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, ShieldAlert, Code2, EyeOff, Menu, X
} from 'lucide-react';

import Dashboard from './pages/Dashboard.tsx';
import Students from './pages/Students.tsx';
import Statistics from './pages/Statistics.tsx';
import Payments from './pages/Payments.tsx';
import Lessons from './pages/Lessons.tsx';
import Login from './pages/Login.tsx';
import Teachers from './pages/Teachers.tsx';

const Footer: React.FC = () => (
  <footer className="mt-auto py-8 text-center border-t border-slate-100 bg-white/50 backdrop-blur-sm rounded-t-[2.5rem] lg:rounded-t-[3rem] pb-24 lg:pb-8">
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
        <Code2 size={16} />
        <span>برمجة : ايهاب جمال غزال</span>
      </div>
      <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
        الإصدار 1.5.0 &copy; {new Date().getFullYear()}
      </div>
    </div>
  </footer>
);

const MobileNav: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const location = useLocation();
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'الرئيسية' },
    { to: '/students', icon: <Users size={20} />, label: 'الطلاب' },
    { to: '/lessons', icon: <BookOpen size={20} />, label: 'الدروس' },
    { to: '/payments', icon: <Wallet size={20} />, label: 'المالية' },
    { to: '/statistics', icon: <BarChart3 size={20} />, label: 'تقارير' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-2 py-3 z-[60] flex justify-around items-center rounded-t-3xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
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
  const [activationCode, setActivationCode] = useState('');
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState('');

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, is_approved')
        .eq('id', uid)
        .maybeSingle();
      
      if (error) throw error;
      setProfile(data || { role: 'teacher', is_approved: false });
    } catch (e) {
      console.error("Profile Fetch Error:", e);
      setProfile({ role: 'teacher', is_approved: false }); 
    } finally {
      setLoading(false);
    }
  };

  const handleUseCode = async () => {
    if (!activationCode.trim() || !session) return;
    setActLoading(true);
    setActError('');
    try {
      const { data: codeData, error: codeErr } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', activationCode.trim().toUpperCase())
        .eq('is_used', false)
        .maybeSingle();

      if (codeErr) throw codeErr;
      if (!codeData) {
        setActError('كود التفعيل غير صحيح أو تم استخدامه مسبقاً');
        setActLoading(false);
        return;
      }

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', session.user.id);

      if (profErr) throw profErr;

      await supabase
        .from('activation_codes')
        .update({ is_used: true, used_by: session.user.id })
        .eq('id', codeData.id);

      await fetchProfile(session.user.id);
    } catch (e: any) {
      setActError('خطأ: ' + e.message);
    } finally {
      setActLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();

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
      <p className="font-bold text-slate-600 text-lg">جاري تحميل النظام الفني...</p>
    </div>
  );

  if (!session) return <Login />;

  if (profile && profile.role === 'teacher' && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Cairo'] text-center">
        <div className="bg-white p-8 md:p-14 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl max-w-xl border border-slate-100 relative overflow-hidden">
           <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-6">
             <ShieldAlert size={40} />
           </div>
           <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mb-4 tracking-tight">حسابك قيد المراجعة</h1>
           <p className="text-slate-500 font-bold leading-relaxed mb-8 text-sm lg:text-base">
             مرحباً <span className="text-indigo-600">{profile.full_name}</span>. يرجى إدخال كود التفعيل لتشغيل النظام.
           </p>
           <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-200 mb-6 shadow-sm">
              <input 
                type="text" 
                placeholder="أدخل كود التفعيل" 
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl text-center font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-500 transition-all text-lg"
                value={activationCode}
                onChange={e => setActivationCode(e.target.value)}
              />
              {actError && <p className="text-rose-600 text-xs font-bold">{actError}</p>}
              <button 
                onClick={handleUseCode}
                disabled={actLoading || !activationCode}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {actLoading ? "جاري التفعيل..." : "تفعيل الحساب الآن"}
              </button>
           </div>
           <button onClick={() => supabase.auth.signOut()} className="text-slate-400 font-bold hover:text-rose-600 transition-all flex items-center justify-center gap-2 mx-auto"><LogOut size={16} /> خروج</button>
        </div>
      </div>
    );
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
            <button onClick={() => setSupervisedTeacher(null)} className="bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1"><EyeOff size={10} /> إنهاء</button>
          </div>
        )}

        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200 flex-col p-8 sticky top-0 h-screen shadow-sm">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl">
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
                <p className="text-[10px] font-black text-slate-400 uppercase px-4 mb-3">النظام</p>
                <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="المعلمون" />
              </div>
            )}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-8 flex items-center gap-3 px-5 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> خروج</button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen max-w-full">
          <header className={`h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 z-40 sticky top-0 ${supervisedTeacher ? 'mt-10' : ''}`}>
            <div className="font-black text-slate-900 text-base lg:text-lg truncate max-w-[60%]">
              {supervisedTeacher ? `إشراف: ${supervisedTeacher.name}` : (isAdmin ? 'الإدارة العامة' : 'لوحة تحكم المعلم')}
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs lg:text-sm font-black text-slate-900">{profile?.full_name}</p>
                <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase">{isAdmin ? 'المدير' : 'معلم'}</p>
              </div>
              <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg uppercase text-sm">{profile?.full_name?.charAt(0) || 'U'}</div>
              {isAdmin && (
                 <Link to="/teachers" className="lg:hidden p-2 text-slate-400 hover:text-indigo-600">
                   <ShieldCheck size={20} />
                 </Link>
              )}
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-10 flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-grow">
              <Routes>
                <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} />} />
                <Route path="/students" element={<Students role={effectiveRole} uid={effectiveUid} />} />
                <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} />} />
                <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} />} />
                <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} />} />
                {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            <Footer />
          </div>

          {/* شريط التنقل السفلي للموبايل */}
          <MobileNav isAdmin={isAdmin} />
        </main>
      </div>
    </HashRouter>
  );
};

const NavItem = ({ to, icon, label }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default App;
