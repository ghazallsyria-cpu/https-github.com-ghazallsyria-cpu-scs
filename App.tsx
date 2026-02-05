
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
// Add React import to resolve 'Cannot find namespace React' error when using React.FC
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Bell, Star, Menu, X, ShieldAlert, Key, RefreshCw, CheckCircle, Sparkles, BarChart3, Send, Radio, PhoneCall
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';
import Statistics from './pages/Statistics';
import Messaging from './pages/Messaging';

const ADMIN_PHONE = '55315661';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisedTeacher, setSupervisedTeacher] = useState<{id: string, name: string} | null>(null);
  const [currentYear, setCurrentYear] = useState(localStorage.getItem('selectedYear') || '2025-2026');
  const [currentSemester, setCurrentSemester] = useState(localStorage.getItem('selectedSemester') || '1');
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchProfile(s.user);
        requestNotificationPermission();
      }
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      setSession(ns);
      if (ns) {
        fetchProfile(ns.user);
        requestNotificationPermission();
      }
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Push notifications enabled.');
      }
    }
  };

  const fetchProfile = async (user: any) => {
    const userPhone = user.user_metadata?.phone || '';
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const isSystemAdmin = userPhone === ADMIN_PHONE || data?.role === 'admin';
      const role = isSystemAdmin ? 'admin' : (data?.role || 'teacher');
      
      setProfile({ 
        ...(data || {}), 
        id: user.id, 
        role: role, 
        is_approved: isSystemAdmin || data?.is_approved 
      });
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleActivateAccount = async () => {
    if (!activationCode || activationCode.length < 5) return;
    setActivating(true);
    try {
      const { data: codeData } = await supabase.from('activation_codes').select('*').eq('code', activationCode.toUpperCase()).eq('is_used', false).maybeSingle();
      if (!codeData) { alert("كود التفعيل غير صحيح."); return; }
      await Promise.all([
        supabase.from('profiles').update({ is_approved: true }).eq('id', session.user.id),
        supabase.from('activation_codes').update({ is_used: true, used_by: session.user.id }).eq('id', codeData.id)
      ]);
      window.location.reload();
    } catch (e) { alert("حدث خطأ."); } finally { setActivating(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-indigo-600 animate-pulse tracking-widest">تحميل القمة التعليمية...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  if (profile && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right font-['Cairo']" dir="rtl">
        <div className="bg-white w-full max-w-xl p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-white text-center">
            <div className="bg-amber-100 text-amber-600 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] inline-block mb-8 animate-bounce">
               <ShieldAlert size={48} className="md:w-16 md:h-16" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">الحساب قيد المراجعة</h1>
            <p className="text-slate-500 font-bold mb-10 text-sm md:text-base">أهلاً بك يا أستاذ <b>{profile.full_name}</b>. حسابك بانتظار موافقة الإدارة.</p>
            <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] mb-10">
               <input placeholder="كود التفعيل الفوري" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-center uppercase mb-4" value={activationCode} onChange={e => setActivationCode(e.target.value)} />
               <button disabled={activating} onClick={handleActivateAccount} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">تفعيل الآن</button>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="text-rose-500 font-black flex items-center gap-2 mx-auto"><LogOut size={18} /> خروج</button>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : 'teacher';

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: "الرئيسية" },
    { to: "/schedule", icon: <Calendar size={24} />, label: "الجدول" },
    { to: "/students", icon: <Users size={24} />, label: "الطلاب" },
    { to: "/lessons", icon: <BookOpen size={24} />, label: "الحصص" },
    { to: "/payments", icon: <Wallet size={24} />, label: "المالية" },
    { to: "/statistics", icon: <BarChart3 size={24} />, label: "الإحصائيات" },
  ];

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row text-right font-['Cairo']" dir="rtl">
        
        {/* SIDEBAR - DESKTOP ONLY */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col sticky top-0 h-screen z-50 shadow-sm">
          <div className="p-10 flex flex-col items-center gap-4 border-b border-slate-50">
            <div className="bg-indigo-600 p-5 rounded-[2.2rem] text-white shadow-xl shadow-indigo-100">
              <GraduationCap size={40} />
            </div>
            <span className="font-black text-slate-900 text-2xl">منصة القمة</span>
          </div>
          
          <nav className="flex-1 px-8 py-10 space-y-4 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl -translate-x-2' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-slate-50 space-y-4">
                <span className="px-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">أدوات الإدارة</span>
                <NavLink to="/messaging" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? 'bg-amber-600 text-white shadow-xl -translate-x-2' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}>
                  {({ isActive: linkActive }) => (
                    <>
                      <Radio size={24} className={linkActive ? "" : "animate-pulse"} /> مركز البث الفوري
                    </>
                  )}
                </NavLink>
                <NavLink to="/teachers" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <ShieldCheck size={24} /> إدارة المعلمين
                </NavLink>
              </div>
            )}
          </nav>

          <div className="p-10 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-4 py-5 text-rose-500 font-black hover:bg-rose-50 rounded-[2rem] transition-all">
               <LogOut size={22} /> تسجيل الخروج
             </button>
          </div>
        </aside>

        {/* MOBILE NAV - FLOATING BOTTOM BAR */}
        <nav className="lg:hidden fixed bottom-4 inset-x-4 bg-white/90 backdrop-blur-2xl border border-slate-100 flex justify-around items-center px-2 py-4 z-[100] shadow-2xl rounded-[2.5rem]">
          {navItems.slice(0, 4).map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${isActive ? 'text-indigo-600 bg-indigo-50/50 scale-110' : 'text-slate-400'}`}>
              {item.icon}
              <span className="text-[9px] font-black">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/messaging" className={({isActive}) => `flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${isActive ? 'text-amber-600 bg-amber-50/50 scale-110' : 'text-amber-500/50'}`}>
              <Radio size={24} />
              <span className="text-[9px] font-black">بث</span>
            </NavLink>
          )}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
          <header className="h-20 md:h-28 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between border-b border-slate-100">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{isAdmin ? 'المدير العام' : 'المعلم المعتمد'}</span>
                <span className="text-lg md:text-xl font-black text-slate-900 truncate max-w-[150px] md:max-w-none">{profile?.full_name}</span>
             </div>
             <div className="bg-indigo-600 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-sm md:text-base">
                {profile?.full_name?.[0] || 'A'}
             </div>
          </header>

          <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full">
            {supervisedTeacher && (
              <div className="mb-8 p-6 bg-amber-500 text-white rounded-[2rem] flex flex-col md:flex-row items-center justify-between shadow-xl gap-4">
                <span className="font-black text-sm md:text-base text-center md:text-right">أنت تتصفح بيانات: {supervisedTeacher.name}</span>
                <button onClick={() => setSupervisedTeacher(null)} className="bg-white text-amber-600 px-6 py-2 rounded-full font-black text-xs active:scale-95">إغلاق الرقابة</button>
              </div>
            )}
            
            <div className="pb-24 lg:pb-0">
              <Routes>
                <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                <Route path="/messaging" element={isAdmin ? <Messaging /> : <Navigate to="/" />} />
                <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
                <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
                {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>

          {/* SHARED FOOTER */}
          <footer className="bg-white border-t border-slate-100 py-8 px-6 text-center mt-auto">
             <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-slate-400">
                <p className="font-black text-xs md:text-sm">برمجة الاستاذ ايهاب جمال غزال</p>
                <span className="hidden md:inline opacity-30">|</span>
                <a href="tel:55315661" className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-black text-xs hover:bg-indigo-600 hover:text-white transition-all">
                   <PhoneCall size={14} /> للإإستفسار : 55315661
                </a>
             </div>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Summit Management System © 2025</p>
          </footer>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
