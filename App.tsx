
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, ShieldAlert, Code2, EyeOff, Menu, X, CalendarDays, Layers, CheckCircle, KeyRound, ArrowLeft
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
        الإصدار 2.0.1 &copy; {new Date().getFullYear()}
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

// مكون تفعيل الحساب
const ActivationOverlay: React.FC<{ onActivated: () => void, profileName: string }> = ({ onActivated, profileName }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error: funcError } = await supabase.rpc('activate_account_with_code', { provided_code: code.trim().toUpperCase() });
      
      if (funcError) throw funcError;

      if (data.success) {
        setSuccess(true);
        setTimeout(() => onActivated(), 2000);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالنظام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 font-['Cairo'] text-right">
      <div className="bg-white w-full max-w-lg p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full opacity-50"></div>
        
        <div className="relative z-10">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl rotate-3">
            <KeyRound size={40} />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2">تنشيط حساب المعلم</h2>
          <p className="text-slate-500 font-bold mb-8">مرحباً بك <span className="text-indigo-600">{profileName}</span>. حسابك بانتظار التنشيط، يرجى إدخال الكود المستلم من الإدارة.</p>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex gap-3 border border-rose-100 animate-shake">
              <ShieldAlert size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2rem] mb-6 text-center animate-bounce">
              <CheckCircle size={48} className="mx-auto mb-3" />
              <p className="font-black">تم تفعيل حسابك بنجاح! جاري التحميل...</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleActivate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 mr-4 uppercase tracking-widest">كود التفعيل (8 خانات)</label>
                <input 
                  required 
                  maxLength={8}
                  placeholder="مثال: ABC123XY"
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-center font-black text-3xl tracking-[0.3em] uppercase outline-none focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              
              <button 
                disabled={loading || code.length < 5}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "تنشيط الحساب الآن"}
              </button>

              <button 
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="w-full py-4 text-slate-400 font-bold hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={18} /> تسجيل الخروج والعودة لاحقاً
              </button>
            </form>
          )}
        </div>
      </div>
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

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await supabase.auth.signOut();
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white font-['Cairo']">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="font-bold text-slate-600 text-lg">جاري تحميل النظام الفني...</p>
    </div>
  );

  if (!session) return <Login />;

  // إذا كان المستخدم معلماً وغير مفعل، نظهر واجهة التنشيط
  if (profile && !profile.is_approved && profile.role !== 'admin' && !supervisedTeacher) {
    return <ActivationOverlay profileName={profile.full_name} onActivated={() => fetchProfile(session.user.id)} />;
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
          <button onClick={handleLogout} className="mt-8 flex items-center gap-3 px-5 py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> تسجيل خروج</button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen max-w-full">
          <header className={`h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 z-40 sticky top-0 ${supervisedTeacher ? 'mt-10' : ''}`}>
            <div className="flex items-center gap-3 lg:gap-6">
              {/* اختيار السنة والفصل */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl lg:rounded-2xl border border-slate-200">
                <div className="relative group">
                   <select 
                    value={currentYear} 
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="bg-transparent text-[10px] lg:text-xs font-black text-slate-700 outline-none pr-6 pl-2 py-1 appearance-none cursor-pointer"
                   >
                     <option value="2023-2024">2023-2024</option>
                     <option value="2024-2025">2024-2025</option>
                     <option value="2025-2026">2025-2026</option>
                   </select>
                   <CalendarDays size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="relative group">
                   <select 
                    value={currentSemester} 
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="bg-transparent text-[10px] lg:text-xs font-black text-slate-700 outline-none pr-6 pl-2 py-1 appearance-none cursor-pointer"
                   >
                     <option value="1">الفصل الأول</option>
                     <option value="2">الفصل الثاني</option>
                   </select>
                   <Layers size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs lg:text-sm font-black text-slate-900">{profile?.full_name}</p>
                <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase">{isAdmin ? 'المدير' : 'معلم'}</p>
              </div>
              <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg uppercase text-sm">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <button 
                onClick={handleLogout} 
                className="lg:hidden p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all"
                aria-label="تسجيل خروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-10 flex flex-col pb-24 lg:pb-10">
            <div className="max-w-7xl mx-auto w-full flex-grow">
              <Routes>
                <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/students" element={<Students role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            <Footer />
          </div>

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
