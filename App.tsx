
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, FileText, Settings, Bell, Star, Menu, X, ShieldAlert, Key, RefreshCw, CheckCircle
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import Reports from './pages/Reports';

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
      if (s) fetchProfile(s.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      setSession(ns);
      if (ns) fetchProfile(ns.user);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleActivateAccount = async () => {
    if (!activationCode || activationCode.length < 5) return;
    setActivating(true);
    try {
      // 1. التحقق من الكود
      const { data: codeData, error: codeError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', activationCode.toUpperCase())
        .eq('is_used', false)
        .maybeSingle();

      if (codeError || !codeData) {
        alert("كود التفعيل غير صحيح أو تم استخدامه مسبقاً.");
        return;
      }

      // 2. تفعيل الحساب وتحديث الكود
      await Promise.all([
        supabase.from('profiles').update({ is_approved: true }).eq('id', session.user.id),
        supabase.from('activation_codes').update({ is_used: true, used_by: session.user.id }).eq('id', codeData.id)
      ]);

      alert("تم تفعيل حسابك بنجاح! مرحباً بك في القمة.");
      window.location.reload();
    } catch (e) {
      alert("حدث خطأ أثناء التفعيل.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-100"></div>
        <p className="font-black text-indigo-600 text-lg animate-pulse">يتم الآن تهيئة القمة...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  // شاشة بانتظار الموافقة
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
            <p className="text-slate-500 font-bold leading-relaxed">
              أهلاً بك يا أستاذ <b>{profile.full_name}</b>.
              <br/>
              حسابك بانتظار موافقة الإدارة المركزية لتتمكن من الوصول لبيانات الطلاب والدروس.
            </p>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10">
             <div className="flex items-center gap-3 mb-6 text-indigo-600">
               <Key size={20} />
               <span className="font-black text-sm uppercase tracking-widest">تفعيل فوري بالكود</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 mb-4">إذا كنت تملك كود تفعيل من الإدارة، أدخله هنا للوصول الفوري:</p>
             <div className="flex gap-3">
               <input 
                 placeholder="ABC-123"
                 className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-center tracking-[0.3em] uppercase outline-none focus:border-indigo-600 transition-all"
                 value={activationCode}
                 onChange={e => setActivationCode(e.target.value)}
               />
               <button 
                 disabled={activating || !activationCode}
                 onClick={handleActivateAccount}
                 className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
               >
                 {activating ? <RefreshCw className="animate-spin" /> : <CheckCircle size={24}/>}
               </button>
             </div>
          </div>

          <div className="flex flex-col items-center gap-6">
             <p className="text-[11px] font-black text-slate-400">تواصل مع المدير العام للتفعيل: <span className="text-indigo-600">{ADMIN_PHONE}</span></p>
             <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 text-rose-500 font-black text-sm hover:underline">
               <LogOut size={18} /> تسجيل الخروج والعودة
             </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : 'teacher';

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={22} />, label: "لوحة التحكم" },
    { to: "/schedule", icon: <Calendar size={22} />, label: "جدول المواعيد" },
    { to: "/students", icon: <Users size={22} />, label: "إدارة الطلاب" },
    { to: "/lessons", icon: <BookOpen size={22} />, label: "سجل الحصص" },
    { to: "/payments", icon: <Wallet size={22} />, label: "المركز المالي" },
    { to: "/reports", icon: <FileText size={22} />, label: "التقارير" },
  ];

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col lg:flex-row-reverse text-right" dir="rtl">
        
        {/* Sidebar */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col sticky top-0 h-screen z-50 shadow-[10px_0_40px_rgba(0,0,0,0.03)]">
          <div className="p-10 flex items-center gap-4 border-b border-slate-50/50">
            <div className="bg-gradient-to-tr from-indigo-700 to-indigo-500 p-3 rounded-2xl text-white shadow-xl">
              <GraduationCap size={30} />
            </div>
            <div>
              <span className="font-black text-slate-900 text-xl block leading-none">نظام القمة</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2 block">إصدار التميز V3.0</span>
            </div>
          </div>
          
          <nav className="flex-1 px-6 py-10 space-y-3 overflow-y-auto no-scrollbar">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive}) => `flex items-center gap-4 px-6 py-4 rounded-[1.8rem] font-black text-[13px] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/teachers" className={({isActive}) => `flex items-center gap-4 px-6 py-4 rounded-[1.8rem] font-black text-[13px] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}>
                <ShieldCheck size={22} /> شؤون المعلمين
              </NavLink>
            )}
          </nav>

          <div className="p-10 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-rose-500 font-black hover:bg-rose-50 transition-all text-sm">
               <LogOut size={20} /> تسجيل الخروج
             </button>
          </div>
        </aside>

        {/* Mobile Nav */}
        <nav className="lg:hidden fixed bottom-6 inset-x-6 bg-white/95 backdrop-blur-2xl border border-white/50 flex justify-around items-center px-4 py-5 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.8rem]">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
              {item.icon}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/teachers" className={({isActive}) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
              <Settings size={22} />
            </NavLink>
          )}
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pb-32 lg:pb-0 relative">
          <header className="h-28 bg-white/60 backdrop-blur-2xl sticky top-0 z-40 px-8 lg:px-14 flex items-center justify-between border-b border-slate-100/50">
            <div className="flex items-center gap-8">
              <div className="hidden md:flex gap-4">
                <select value={currentSemester} onChange={e => { setCurrentSemester(e.target.value); localStorage.setItem('selectedSemester', e.target.value); }} className="bg-white border-2 border-slate-50 text-[12px] font-black px-8 py-3 rounded-2xl outline-none focus:border-indigo-600 shadow-sm transition-all">
                  <option value="1">الفصل الأول</option>
                  <option value="2">الفصل الثاني</option>
                </select>
                <select value={currentYear} onChange={e => { setCurrentYear(e.target.value); localStorage.setItem('selectedYear', e.target.value); }} className="bg-white border-2 border-slate-50 text-[12px] font-black px-8 py-3 rounded-2xl outline-none focus:border-indigo-600 shadow-sm transition-all">
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>
              <div className="h-12 w-[2px] bg-slate-100 hidden md:block rounded-full"></div>
              <div>
                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">{isAdmin ? 'المدير العام' : 'معلم معتمد'}</p>
                <p className="text-lg font-black text-slate-900 mt-1">{profile?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
               <button className="bg-white border border-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm relative">
                 <Bell size={22}/>
                 <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
               </button>
               <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-2xl shadow-indigo-100 text-xl border-2 border-white">
                  {profile?.full_name?.[0]?.toUpperCase() || 'A'}
               </div>
            </div>
          </header>

          <div className="p-8 lg:p-14 max-w-7xl mx-auto">
            {supervisedTeacher && (
              <div className="mb-12 p-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-[2.5rem] flex items-center justify-between shadow-2xl animate-in slide-in-from-top-6 duration-700">
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner"><Users size={24}/></div>
                  <div>
                    <span className="font-black text-lg block">تصفح بوضع الرقابة</span>
                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">المعلم: {supervisedTeacher.name}</span>
                  </div>
                </div>
                <button onClick={() => setSupervisedTeacher(null)} className="bg-white text-orange-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all shadow-xl active:scale-95">العودة للوحة الإدارة</button>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} onYearChange={setCurrentYear} onSemesterChange={setCurrentSemester} />} />
              <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
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
