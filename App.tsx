import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { 
  LayoutDashboard, Users, Wallet, GraduationCap, LogOut, ShieldCheck, BookOpen, Code2, Clock, FileDown, Database
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
import DatabaseViewer from './pages/DatabaseViewer';

const ADMIN_PHONE = '55315661';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisedTeacher, setSupervisedTeacher] = useState<{id: string, name: string} | null>(null);
  const [currentYear, setCurrentYear] = useState(localStorage.getItem('selectedYear') || '2024-2025');
  const [currentSemester, setCurrentSemester] = useState(localStorage.getItem('selectedSemester') || '1');

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      
      // نظام التخطي الذكي: إذا فشل جلب البيانات ولكن المستخدم هو صاحب الرقم المدير، نمنحه الصلاحية يدوياً
      if (data && data.phone === ADMIN_PHONE) {
        setProfile({ ...data, role: 'admin', is_approved: true });
      } else if (error || !data) {
        setProfile({ role: 'teacher', is_approved: false });
      } else {
        setProfile(data);
      }
    } catch (e) {
      setProfile({ role: 'teacher', is_approved: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchProfile(s.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, ns) => {
      setSession(ns);
      if (ns) fetchProfile(ns.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-['Cairo']">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return <Login />;

  // التحقق النهائي من رتبة المدير
  const isAdmin = profile?.role === 'admin' || profile?.phone === ADMIN_PHONE;
  const effectiveUid = supervisedTeacher ? supervisedTeacher.id : session.user.id;
  const effectiveRole = isAdmin && !supervisedTeacher ? 'admin' : 'teacher';

  return (
    <HashRouter>
      <div className="min-h-screen flex font-['Cairo'] selection:bg-indigo-100 selection:text-indigo-600">
        {supervisedTeacher && (
          <div className="fixed top-0 inset-x-0 h-11 bg-amber-600 text-white z-[100] flex items-center justify-center gap-4 px-4 shadow-xl">
             <span className="font-black text-xs">وضع الرقابة: {supervisedTeacher.name}</span>
             <button onClick={() => setSupervisedTeacher(null)} className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">إغلاق</button>
          </div>
        )}

        <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col p-8 sticky top-0 h-screen">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100"><GraduationCap size={28} /></div>
            <h1 className="text-xl font-black text-slate-900">إدارة الطلاب</h1>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            <Link to="/" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><LayoutDashboard size={20}/> الرئيسية</Link>
            <Link to="/schedule" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><Clock size={20}/> الجدول</Link>
            <Link to="/students" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><Users size={20}/> الطلاب</Link>
            <Link to="/lessons" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><BookOpen size={20}/> الحصص</Link>
            <Link to="/payments" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><Wallet size={20}/> المالية</Link>
            <Link to="/reports" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><FileDown size={20}/> التقارير</Link>
            {isAdmin && <Link to="/teachers" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 shadow-sm"><ShieldCheck size={20}/> الإدارة</Link>}
            {isAdmin && <Link to="/database-viewer" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-50 transition-all"><Database size={20}/> قواعد البيانات</Link>}
          </nav>
          <button onClick={() => supabase.auth.signOut()} className="mt-8 flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 font-black hover:bg-rose-50 transition-all">
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
          <header className={`h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 z-40 sticky top-0 ${supervisedTeacher ? 'mt-11' : ''}`}>
            <div className="flex items-center gap-4">
               <span className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">
                 {isAdmin ? "وضع المدير العام" : "وضع المحتوى"}
               </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
              {profile?.full_name?.[0] || 'U'}
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-10">
            <Routes>
              <Route path="/" element={<Dashboard role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/students" element={<Students isAdmin={isAdmin} role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/statistics" element={<Statistics role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/payments" element={<Payments role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/lessons" element={<Lessons role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              <Route path="/schedule" element={<Schedule role={effectiveRole} uid={effectiveUid} />} />
              <Route path="/reports" element={<Reports role={effectiveRole} uid={effectiveUid} year={currentYear} semester={currentSemester} />} />
              {isAdmin && <Route path="/teachers" element={<Teachers onSupervise={setSupervisedTeacher} />} />}
              {isAdmin && <Route path="/database-viewer" element={<DatabaseViewer />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;