
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Bell, Star, Menu, X, ShieldAlert, Key, RefreshCw, CheckCircle, Sparkles, BarChart3, Send
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
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        // هنا يتم منطق تسجيل الـ Push Subscription وحفظه في السوبابيس
        console.log('Notification permission granted.');
      }
    }
  };

  const fetchProfile = async (user: any) => {
    const userPhone = user.user_metadata?.phone || '';
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const isSystemAdmin = userPhone === ADMIN_PHONE || data?.role === 'admin';
      const role = isSystemAdmin ? 'admin' : (data?.role || 'teacher');
      setProfile({ ...(data || {}), id: user.id, role: role, is_approved: isSystemAdmin || data?.is_approved });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleActivateAccount = async () => {
    if (!activationCode || activationCode.length < 5) return;
    setActivating(true);
    try {
      const { data: codeData, error: codeError } = await supabase.from('activation_codes').select('*').eq('code', activationCode.toUpperCase()).eq('is_used', false).maybeSingle();
      if (codeError || !codeData) { alert("كود التفعيل غير صحيح."); return; }
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
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl"></div>
        <p className="font-black text-indigo-600 animate-pulse tracking-widest">تحميل القمة التعليمية...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  if (profile && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-right font-['Cairo']" dir="rtl">
        <div className="bg-white w-full max-w-xl p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-3 bg-amber-500"></div>
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-amber-100 text-amber-600 p-8 rounded-[3rem] mb-8 animate-bounce shadow-inner">
               <ShieldAlert size={64} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">الحساب قيد المراجعة</h1>
            <p className="text-slate-500 font-bold leading-relaxed">أهلاً بك يا أستاذ <b>{profile.full_name}</b>.<br/>حسابك بانتظار موافقة الإدارة المركزية.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10">
             <div className="flex items-center gap-3 mb-6 text-indigo-600">
               <Key size={20} />
               <span className="font-black text-sm uppercase tracking-widest">تفعيل فوري بالكود</span>
             </div>
             <div className="flex gap-3">
               <input placeholder="ABC-123" className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-center uppercase outline-none focus:border-indigo-600 transition-all" value={activationCode} onChange={e => setActivationCode(e.target.value)} />
               <button disabled={activating || !activationCode} onClick={handleActivateAccount} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">
                 {activating ? <RefreshCw className="animate-spin" /> : <CheckCircle size={24}/>}
               </button>
             </div>
          </div>
          <div className="flex flex-col items-center gap-6">
             <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 text-rose-500 font-black text-sm hover:underline"><LogOut size={18} /> تسجيل الخروج</button>
          </div>
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
    { to: "/reports", icon: <FileText size={24} />, label: "التقارير" },
  ];

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row text-right font-['Cairo']" dir="rtl">
        
        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col sticky top-0 h-screen z-50 shadow-[10px_0_40px_rgba(0,0,0,0.02)]">
          <div className="p-10 flex flex-col items-center text-center gap-4 border-b border-slate-50/50">
            <div className="bg-gradient-to-tr from-indigo-700 to-indigo-500 p-5 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200">
              <GraduationCap size={44} />
            </div>
            <div>
              <span className="font-black text-slate-900 text-2xl block leading-none">منصة القمة</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3 block">CORE SYSTEM V3.1</span>
            </div>
          </div>
          
          <nav className="flex-1 px-8 py-10 space-y-4 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 -translate-x-2' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600 hover:-translate-x-1'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <>
                <NavLink to="/messaging" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all duration-500 ${isActive ? 'bg-amber-600 text-white shadow-2xl shadow-amber-200 -translate-x-2' : 'text-amber-500 hover:bg-amber-50 hover:-translate-x-1'}`}>
                  <Send size={24} /> مركز البث
                </NavLink>
                <NavLink to="/teachers" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 -translate-x-2' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}>
                  <ShieldCheck size={24} /> المعلمين
                </NavLink>
              </>
            )}
          </nav>

          <div className="p-10 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] text-rose-500 font-black hover:bg-rose-50 transition-all text-sm group">
               <LogOut size={22} className="group-hover:rotate-180 transition-transform duration-500" /> خروج آمن
             </button>
          </div>
        </aside>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden fixed bottom-6 inset-x-6 bg-slate-900/90 backdrop-blur-3xl border border-white/10 flex justify-around items-center px-4 py-5 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[3rem]">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-500 ${isActive ? 'text-indigo-400 scale-125 -translate-y-2' : 'text-slate-500 opacity-60'}`}>
              {item.icon}
            </NavLink>
          ))}
          {isAdmin && (
             <NavLink to="/messaging" className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-500 ${isActive ? 'text-amber-400 scale-125 -translate-y-2' : 'text-amber-500 opacity-40'}`}>
                <Send size={24} />
             </NavLink>
          )}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-h-screen pb-32 lg:pb-0 relative bg-slate-50/30">
          <header className="h-32 bg-white/70 backdrop-blur-3xl sticky top-0 z-40 px-10 lg:px-16 flex items-center justify-between border-b border-slate-100/50">
            <div className="flex items-center gap-10">
              <div className="hidden md:flex items-center gap-4 bg-slate-100/50 p-2 rounded-[2rem] border border-slate-200/50">
                <select value={currentSemester} onChange={e => { setCurrentSemester(e.target.value); localStorage.setItem('selectedSemester', e.target.value); }} className="bg-white border-none text-[12px] font-black px-6 py-3 rounded-[1.5rem] outline-none shadow-sm cursor-pointer">
                  <option value="1">الفصل 1</option><option value="2">الفصل 2</option>
                </select>
                <select value={currentYear} onChange={e => { setCurrentYear(e.target.value); localStorage.setItem('selectedYear', e.target.value); }} className="bg-white border-none text-[12px] font-black px-6 py-3 rounded-[1.5rem] outline-none shadow-sm cursor-pointer">
                  <option value="2025-2026">2025-2026</option><option value="2026-2027">2026-2027</option>
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{isAdmin ? 'المدير العام' : 'المعلم المعتمد'}</span>
                <span className="text-xl font-black text-slate-900 mt-1">{profile?.full_name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
               <button className="hidden sm:flex bg-white border border-slate-100 text-slate-400 p-5 rounded-[1.5rem] hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm relative group">
                 <Bell size={24}/>
                 <span className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
               </button>
               <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 w-16 h-16 rounded-[2rem] flex items-center justify-center text-white font-black shadow-2xl shadow-indigo-100 text-2xl border-4 border-white rotate-6 hover:rotate-0 transition-all cursor-pointer">
                  {profile?.full_name?.[0]?.toUpperCase() || 'S'}
               </div>
            </div>
          </header>

          <div className="p-8 lg:p-16 max-w-[1600px] mx-auto overflow-hidden">
            {supervisedTeacher && (
              <div className="mb-14 p-10 bg-gradient-to-l from-amber-500 to-orange-600 text-white rounded-[4rem] flex flex-col md:flex-row items-center justify-between shadow-2xl animate-in slide-in-from-top-10 duration-1000">
                <div className="flex items-center gap-8 mb-6 md:mb-0 text-center md:text-right">
                  <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-xl shadow-inner"><Users size={32}/></div>
                  <div>
                    <span className="font-black text-2xl block mb-1">وضعية الرقابة المركزية</span>
                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">تصفح بيانات المعلم: {supervisedTeacher.name}</span>
                  </div>
                </div>
                <button onClick={() => setSupervisedTeacher(null)} className="bg-white text-orange-600 px-10 py-5 rounded-[2rem] font-black text-sm hover:bg-slate-50 transition-all shadow-2xl active:scale-95">إنهاء الرقابة والعودة</button>
              </div>
            )}
            
            <div className="animate-in fade-in duration-1000">
                <Routes>
                  <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} onYearChange={setCurrentYear} onSemesterChange={setCurrentSemester} />} />
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
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
