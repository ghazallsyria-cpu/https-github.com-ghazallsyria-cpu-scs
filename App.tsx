
import React, { useEffect, useState, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, NavLink, useLocation } = ReactRouterDOM as any;
import { supabase } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, 
  BookOpen, Calendar, Settings as SettingsIcon, Star, CalendarDays, ShieldAlert, Clock, RefreshCw, ChevronDown, 
  Briefcase, SearchCheck, UserPlus, SlidersHorizontal, Copyright, Loader2
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Lessons from './pages/Lessons';
import Login from './pages/Login';
import Teachers from './pages/Teachers';
import Schedule from './pages/Schedule';
import ParentPortal from './pages/ParentPortal';
import Settings from './pages/Settings';
import TutorRequests from './pages/TutorRequests';
import RequestTutor from './pages/RequestTutor';

const MobileBottomNav = ({ items }: { items: any[] }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-4 py-3 z-[100] flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
      {items.map((item) => (
        <NavLink 
          key={item.to} 
          to={item.to} 
          className={({isActive}: any) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          {({ isActive }: any) => (
            <>
              {React.cloneElement(item.icon, { size: 22, strokeWidth: isActive ? 2.5 : 2 })}
              <span className="text-[10px] font-bold">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [monitoredTeacher, setMonitoredTeacher] = useState<any | null>(null);
  const [showYearMenu, setShowYearMenu] = useState(false);
  
  const [activeYear, setActiveYear] = useState('2025-2026');
  const [activeSemester, setActiveSemester] = useState('1');

  const fetchProfile = useCallback(async (user: any) => {
    if (!user) { setLoading(false); return; }
    try {
      // الأولوية 1: جلب البيانات من Metadata مباشرة لضمان عدم التعليق أو الـ Recursion
      const meta = user.user_metadata;
      if (meta && meta.role) {
         const tempProfile = {
           id: user.id,
           full_name: meta.full_name || 'مستخدم النظام',
           role: meta.role,
           phone: meta.phone || '',
           is_approved: meta.role === 'admin' || meta.role === 'student' || meta.role === 'parent' ? true : (meta.is_approved || false),
           created_at: new Date().toISOString()
         };
         setProfile(tempProfile);
         
         // محاولة تحديث البيانات من الجدول في الخلفية (اختياري)
         supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({data}) => {
           if (data) setProfile(data);
         });
         
         setLoading(false);
         return;
      }

      // الأولوية 2: في حال غياب الـ Metadata (مستخدم قديم مثلاً)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setProfile(data);
      } else if (retryCount < 3) {
        setTimeout(() => setRetryCount(prev => prev + 1), 1000);
        return;
      }
    } catch (err) { 
      console.error("Profile Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [retryCount]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) fetchProfile(initSession.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setLoading(true);
        fetchProfile(newSession.user);
      } else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white font-['Cairo']">
      <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-[2.5rem] animate-spin mb-8"></div>
      <p className="font-black text-indigo-600 animate-pulse text-lg tracking-widest uppercase">نظام القمة V5.7</p>
      {retryCount > 0 && <p className="text-slate-400 text-xs mt-2 italic text-center">جاري فتح قنوات البيانات الماسية ({retryCount}/3)...</p>}
    </div>
  );

  if (!session || !profile) return <Login />;

  const isAdmin = profile?.role === 'admin';
  const isParent = profile?.role === 'parent';
  const isStudent = profile?.role === 'student';
  const isApproved = profile?.is_approved === true;

  if (!isApproved && !isAdmin && !isParent && !isStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Cairo'] text-right" dir="rtl">
        <div className="bg-white w-full max-w-2xl p-12 md:p-20 rounded-[5rem] shadow-2xl border border-slate-100 text-center space-y-10">
           <div className="relative mx-auto w-40 h-40">
              <div className="absolute inset-0 bg-indigo-600 rounded-[3rem] rotate-12 opacity-10 animate-pulse"></div>
              <div className="relative bg-white border-4 border-indigo-50 text-indigo-600 w-full h-full rounded-[3rem] flex items-center justify-center shadow-2xl">
                 <ShieldAlert size={80} strokeWidth={1.5} />
              </div>
           </div>
           <div className="space-y-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">حسابك قيد المراجعة</h1>
              <p className="text-slate-400 font-bold text-lg leading-relaxed">أهلاً بك أ/ <span className="text-indigo-600">{profile.full_name}</span>. جاري تفعيل صلاحياتك من قبل الإدارة.</p>
           </div>
           <button onClick={() => supabase.auth.signOut()} className="w-full py-5 text-rose-500 font-black text-sm hover:bg-rose-50 rounded-2xl transition-all flex items-center justify-center gap-2">
              <LogOut size={20} /> تسجيل الخروج والانتظار
           </button>
        </div>
      </div>
    );
  }

  const menuItems = isAdmin ? [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/requests", icon: <SearchCheck size={20} />, label: "طلبات البحث" },
    { to: "/teachers", icon: <ShieldCheck size={20} />, label: "المعلمون" },
    { to: "/students", icon: <Users size={20} />, label: "الطلاب" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
  ] : (isParent ? [
    { to: "/", icon: <GraduationCap size={20} />, label: "الأبناء" },
    { to: "/request-tutor", icon: <UserPlus size={20} />, label: "طلب معلم" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : (isStudent ? [
    { to: "/", icon: <UserPlus size={20} />, label: "طلب معلم" },
    { to: "/settings", icon: <SettingsIcon size={20} />, label: "الإعدادات" },
  ] : [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "الرئيسية" },
    { to: "/students", icon: <Users size={20} />, label: "طلابي" },
    { to: "/payments", icon: <Wallet size={20} />, label: "المالية" },
    { to: "/lessons", icon: <BookOpen size={20} />, label: "الحصص" },
    { to: "/schedule", icon: <Calendar size={20} />, label: "الجدول" },
  ]));

  const activeProfileForData = (isAdmin && monitoredTeacher) ? monitoredTeacher : profile;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-['Cairo'] text-right overflow-hidden" dir="rtl">
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l border-slate-100 h-screen sticky top-0 z-50 shadow-2xl">
          <div className="p-12 border-b border-slate-50 flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-200 rotate-3"><Star size={24} fill="white" /></div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 leading-none">نظام القمة</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">CONNECT V5.7</p>
            </div>
          </div>
          
          {!isStudent && !isParent && (
            <div className="p-8 bg-slate-50 mx-4 my-6 rounded-[2.5rem] space-y-3 border border-slate-100">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><CalendarDays size={14} /> السنة والفصل</div>
               <select value={activeYear} onChange={e => setActiveYear(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-black text-xs border-none shadow-sm outline-none cursor-pointer">
                  <option value="2024-2025">2024-2025</option><option value="2025-2026">2025-2026</option>
               </select>
               <div className="flex bg-white p-1 rounded-2xl">
                  <button onClick={() => setActiveSemester('1')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${activeSemester === '1' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>فصل 1</button>
                  <button onClick={() => setActiveSemester('2')} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${activeSemester === '2' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>فصل 2</button>
               </div>
            </div>
          )}

          <nav className="flex-1 px-6 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item: any) => (
              <NavLink key={item.to} to={item.to} className={({isActive}: any) => `flex items-center gap-4 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-[-8px]' : 'text-slate-500 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-8 border-t border-slate-50">
             <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-4 text-rose-500 font-black w-full px-8 py-4 hover:bg-rose-50 rounded-[1.5rem] transition-all"><LogOut size={20} /> خروج</button>
          </div>
        </aside>

        <MobileBottomNav items={menuItems} />

        <main className="flex-1 min-w-0 flex flex-col relative">
          <header className="px-6 md:px-14 h-20 md:h-24 flex items-center justify-between bg-white/80 backdrop-blur-2xl border-b border-slate-50 sticky top-0 z-[60]">
             <div className="flex items-center gap-4 md:gap-6">
                <div className="lg:hidden bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg"><Star size={18} fill="white" /></div>
                <div className="min-w-0">
                   <p className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{profile.role === 'admin' ? 'المدير العام' : profile.role === 'student' ? 'الطالب' : 'بوابة القمة'}</p>
                   <h2 className="text-sm md:text-lg font-black text-slate-900 truncate max-w-[150px] md:max-w-[300px]">{profile.full_name}</h2>
                </div>
             </div>
             
             <div className="flex items-center gap-3 md:gap-4">
                {!isStudent && !isParent && (
                  <button 
                    onClick={() => setShowYearMenu(!showYearMenu)}
                    className="lg:hidden p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                  >
                    <SlidersHorizontal size={20} />
                    <span className="text-[10px] font-black uppercase">{activeSemester === '1' ? 'فصل 1' : 'فصل 2'}</span>
                  </button>
                )}

                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-sm md:text-lg border-2 md:border-4 border-white shadow-xl">
                  {profile.full_name[0]}
                </div>
             </div>

             {showYearMenu && (
                <div className="absolute top-24 left-6 right-6 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-indigo-50 lg:hidden z-[100] animate-in slide-in-from-top-4">
                   <div className="space-y-6">
                      <div className="space-y-2 text-right">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">السنة الدراسية</label>
                         <select value={activeYear} onChange={e => setActiveYear(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-sm border-none">
                            <option value="2024-2025">2024-2025</option><option value="2025-2026">2025-2026</option>
                         </select>
                      </div>
                      <div className="space-y-2 text-right">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الفصل الدراسي</label>
                         <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                            <button onClick={() => {setActiveSemester('1'); setShowYearMenu(false);}} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${activeSemester === '1' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>الفصل 1</button>
                            <button onClick={() => {setActiveSemester('2'); setShowYearMenu(false);}} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${activeSemester === '2' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>الفصل 2</button>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </header>

          <div className="flex-1 p-4 md:p-12 max-w-[1700px] mx-auto w-full pb-32 lg:pb-12 overflow-y-auto">
            <Routes>
               {isStudent || isParent ? (
                 <>
                   <Route path="/" element={isParent ? <ParentPortal parentPhone={profile.phone || ''} /> : <Navigate to="/request-tutor" />} />
                   <Route path="/request-tutor" element={<RequestTutor userPhone={profile.phone} />} />
                 </>
               ) : (
                 <>
                   <Route path="/" element={<Dashboard role={profile.role} profile={activeProfileForData} isAdminActual={isAdmin} monitoredTeacher={monitoredTeacher} year={activeYear} semester={activeSemester} />} />
                   <Route path="/students" element={<Students isAdmin={isAdmin} profile={activeProfileForData} monitoredTeacher={monitoredTeacher} year={activeYear} semester={activeSemester} />} />
                   <Route path="/lessons" element={<Lessons role={profile.role} uid={activeProfileForData.id} isAdmin={isAdmin} year={activeYear} semester={activeSemester} />} />
                   <Route path="/payments" element={<Payments role={profile.role} uid={activeProfileForData.id} isAdmin={isAdmin} year={activeYear} semester={activeSemester} />} />
                   <Route path="/schedule" element={<Schedule role={profile.role} uid={activeProfileForData.id} />} />
                   {isAdmin && <Route path="/teachers" element={<Teachers onMonitor={(t: any) => setMonitoredTeacher(t)} currentMonitoredId={monitoredTeacher?.id} />} />}
                   {isAdmin && <Route path="/requests" element={<TutorRequests />} />}
                 </>
               )}
               <Route path="/settings" element={<Settings />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <footer className="mt-20 py-10 border-t border-slate-100 text-center space-y-2">
               <div className="flex items-center justify-center gap-2 text-indigo-600 font-black text-sm">
                  <Copyright size={16} /> برمجة وتطوير : أ / ايهاب جمال غزال
               </div>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">كافة الحقوق محفوظة © 2025 - نظام القمة V5.7</p>
            </footer>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
