
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Bell, Star, Menu, X, ShieldAlert, Key, RefreshCw, CheckCircle, Sparkles, BarChart3, Send, Radio
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
      // منطق تحديد المدير: إما عن طريق رقم الهاتف المحفوظ أو الرتبة في القاعدة
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right font-['Cairo']" dir="rtl">
        <div className="bg-white w-full max-w-xl p-12 rounded-[4rem] shadow-2xl border border-white text-center">
            <div className="bg-amber-100 text-amber-600 p-8 rounded-[3rem] inline-block mb-8 animate-bounce">
               <ShieldAlert size={64} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">الحساب قيد المراجعة</h1>
            <p className="text-slate-500 font-bold mb-10">أهلاً بك يا أستاذ <b>{profile.full_name}</b>. حسابك بانتظار موافقة الإدارة.</p>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] mb-10">
               <input placeholder="كود التفعيل الفوري" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-center uppercase mb-4" value={activationCode} onChange={e => setActivationCode(e.target.value)} />
               <button disabled={activating} onClick={handleActivateAccount} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black">تفعيل الآن</button>
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
        
        {/* SIDEBAR */}
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
            
            {/* خيارات المدير فقط - تم التأكد من ظهورها */}
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-slate-50 space-y-4">
                <span className="px-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">أدوات الإدارة</span>
                {/* Fixed line 166: Use render prop to access isActive in children */}
                <NavLink to="/messaging" className={({isActive}) => `flex items-center gap-5 px-8 py-5 rounded-[2.2rem] font-black text-[14px] transition-all ${isActive ? 'bg-amber-600 text-white shadow-xl -translate-x-2' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}>
                  {({ isActive }) => (
                    <>
                      <Radio size={24} className={isActive ? "" : "animate-pulse"} /> مركز البث الفوري
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

        {/* MOBILE NAV */}
        <nav className="lg:hidden fixed bottom-6 inset-x-6 bg-slate-900/95 backdrop-blur-xl border border-white/10 flex justify-around items-center px-4 py-5 z-[100] shadow-2xl rounded-[3rem]">
          {navItems.slice(0, 4).map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `transition-all ${isActive ? 'text-indigo-400 scale-125' : 'text-slate-500'}`}>
              {item.icon}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/messaging" className={({isActive}) => `transition-all ${isActive ? 'text-amber-400 scale-125' : 'text-amber-500'}`}>
              <Radio size={24} />
            </NavLink>
          )}
        </nav>

        {/* MAIN */}
        <main className="flex-1 min-h-screen relative">
          <header className="h-28 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-10 flex items-center justify-between border-b border-slate-100">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{isAdmin ? 'المدير العام' : 'المعلم المعتمد'}</span>
                <span className="text-xl font-black text-slate-900">{profile?.full_name}</span>
             </div>
             <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                {profile?.full_name?.[0] || 'A'}
             </div>
          </header>

          <div className="p-8 lg:p-12 max-w-[1400px] mx-auto">
            {supervisedTeacher && (
              <div className="mb-10 p-8 bg-amber-500 text-white rounded-[3rem] flex items-center justify-between shadow-xl">
                <span className="font-black">أنت تتصفح بيانات: {supervisedTeacher.name}</span>
                <button onClick={() => setSupervisedTeacher(null)} className="bg-white text-amber-600 px-6 py-2 rounded-full font-black text-xs">إغلاق الرقابة</button>
              </div>
            )}
            
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
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
