import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { 
  LayoutDashboard, Users, BarChart3, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, ShieldAlert, Code2, KeyRound, Clock, FileDown, RefreshCw, Calendar, Sparkles, Database
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
import SqlViewer from './pages/SqlViewer';

const cache = { profile: null as any, lastUid: null as string | null };

const SupabaseConnectionError: React.FC = () => (
    <div className="h-screen flex items-center justify-center bg-rose-50 font-['Cairo'] p-6 text-right">
        <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl text-center max-w-3xl border-4 border-rose-100 animate-in zoom-in duration-500">
            <ShieldAlert size={64} className="text-rose-500 mx-auto mb-8 animate-bounce" />
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">خطأ جسيم في الاتصال</h1>
            <p className="text-slate-600 font-bold mb-10 leading-relaxed text-lg">
                لم يتمكن النظام من الاتصال بقاعدة البيانات. يبدو أن مفاتيح الاتصال الخاصة بـ Supabase غير مُعرَّفة.
            </p>
            <div className="text-right bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-4 font-mono text-sm text-slate-700 shadow-inner">
                <p className="font-['Cairo'] font-bold text-base mb-4">لحل المشكلة، يجب إعداد متغيرات البيئة الخاصة بالمشروع:</p>
                <div className="bg-slate-800 text-white p-6 rounded-3xl text-left text-base">
                    <p><span className="text-purple-400">VITE_SUPABASE_URL</span>=<span className="text-emerald-300">"رابط المشروع الخاص بك"</span></p>
                    <p><span className="text-purple-400">VITE_SUPABASE_ANON_KEY</span>=<span className="text-emerald-300">"مفتاح Anon الخاص بك"</span></p>
                </div>
                 <p className="font-['Cairo'] text-xs text-slate-500 pt-4">إذا كنت لا تملك هذه المفاتيح، يرجى التواصل مع مبرمج النظام لتزويدك بها.</p>
            </div>
        </div>
    </div>
);


const Footer: React.FC = () => (
  <footer className="mt-auto py-12 text-center border-t border-slate-100/50 pb-28 lg:pb-12 font-['Cairo']">
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm transition-transform hover:scale-105">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Code2 size={16} /></div>
        <span className="text-slate-900 font-black text-sm">برمجة : ايهاب جمال غزال</span>
      </div>
      <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">الإصدار 3.1.0 &copy; {new Date().getFullYear()}</div>
    </div>
  </footer>
);

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
    <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-2xl border border-white/40 p-2 z-[60] flex justify-around items-center rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-[1.8rem] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-1' : 'text-slate-400'}`}>
            {item.icon}
            {isActive && <span className="text-[10px] font-black">{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
};

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

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisedTeacher, setSupervisedTeacher] = useState<{id: string, name: string} | null>(null);
  const [currentYear, setCurrentYear] = useState(localStorage.getItem('selectedYear') || '2024-2025');
  const [currentSemester, setCurrentSemester] = useState(localStorage.getItem('selectedSemester') || '1');

  const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder');

  useEffect(() => {
    localStorage.setItem('selectedYear', currentYear);
    localStorage.setItem('selectedSemester', currentSemester);
  }, [currentYear, currentSemester]);

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
    } catch (e) { setProfile({ role: 'teacher', is_approved: false }); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchProfile(s.user.id, true);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      setSession(ns);
      if (ns) fetchProfile(ns.user.id, true);
      else { setProfile(null); cache.profile = null; setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [isSupabaseConfigured]);
  
  if (!isSupabaseConfigured) {
    return <SupabaseConnectionError />;
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white font-['Cairo']">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={20} className="text-indigo-400 animate-pulse"/></div>
      </div>
      <p className="font-black text-slate-900 mt-6 text-lg tracking-tight">جاري تهيئة منصة المحتوى...</p>
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
          <div className="fixed top-0 inset-x-0 h-11 bg-gradient-to-r from-amber-500 to-orange-600 text-white z-[100] flex items-center justify-center gap-4 px-4 shadow-xl">
             <ShieldCheck size={18} className="animate-bounce" />
             <span className="font-black text-xs">وضع الرقابة النشط: {supervisedTeacher.name}</span>
             <button onClick={() => setSupervisedTeacher(null)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[10px] font-black transition-all">إنهاء الجلسة</button>
          </div>
        )}

        <aside className="hidden lg:flex w-80 bg-white/70 backdrop-blur-xl border-l border-slate-200/50 flex-col p-10 sticky top-0 h-screen">
          <div className="flex items-center gap-4 mb-16 px-2">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-3.5 rounded-2xl text-white shadow-2xl shadow-indigo-200 rotate-6"><GraduationCap size={32} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-none">إدارة المحتوى</h1>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">المنصة الذكية</p>
            </div>
          </div>
          <nav className="flex-1 space-y-2 pr-2 overflow-y-auto no-scrollbar">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
            <NavItem to="/schedule" icon={<Clock size={20} />} label="الجدول الأسبوعي" />
            <NavItem to="/students" icon={<Users size={20} />} label="سجل الطلاب" />
            <NavItem to="/lessons" icon={<BookOpen size={20} />} label="إدارة الحصص" />
            <NavItem to="/payments" icon={<Wallet size={20} />} label="المركز المالي" />
            <NavItem to="/reports" icon={<FileDown size={20} />} label="التقارير الذكية" />
            <NavItem to="/statistics" icon={<BarChart3 size={20} />} label="تحليل البيانات" />
            {isAdmin && <NavItem to="/teachers" icon={<ShieldCheck size={20} />} label="إدارة المحتوى" />}
            {isAdmin && <NavItem to="/sql-viewer" icon={<Database size={20} />} label="قواعد البيانات" />}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-8 flex items-center gap-4 px-6 py-4 text-rose-500 font-black hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> تسجيل خروج</button>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen bg-transparent">
          <header className={`h-20 lg:h-24 bg-white/60 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-6 lg:px-12 z-40 sticky top-0 ${supervisedTeacher ? 'mt-11' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 flex items-center gap-1 shadow-inner">
                <Calendar size={14} className="text-indigo-600 mx-2" />
                <select value={currentYear} onChange={e => setCurrentYear(e.target.value)} className="bg-transparent text-[11px] font-black px-3 py-1.5 outline-none cursor-pointer">
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                <select value={currentSemester} onChange={e => setCurrentSemester(e.target.value)} className="bg-transparent text-[11px] font-black px-3 py-1.5 outline-none cursor-pointer">
                  <option value="1">الفصل 1</option>
                  <option value="2">الفصل 2</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">{profile?.full_name}</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{isAdmin ? 'المدير العام' : 'إدارة محتوى'}</p>
              </div>
              <div className="relative group cursor-pointer">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-100 transition-transform group-hover:rotate-12 group-hover:scale-110">
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-12">
            <Routes>
              <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
              <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
              {isAdmin && <Route path="/sql-viewer" element={<SqlViewer />} />}
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