
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Wallet, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean;
  onClick?: () => void;
}> = ({ to, icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center space-x-3 mb-10 px-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <GraduationCap size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">TutorTrack</h1>
            </div>

            <nav className="flex-1 space-y-2">
              <NavLinks onLinkClick={() => setIsSidebarOpen(false)} />
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 px-4">TutorTrack Pro v1.0.0</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-4 ml-auto">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                TR
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/payments" element={<Payments />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

const NavLinks: React.FC<{ onLinkClick: () => void }> = ({ onLinkClick }) => {
  const location = useLocation();
  
  return (
    <>
      <SidebarItem 
        to="/" 
        icon={<LayoutDashboard size={20} />} 
        label="Dashboard" 
        active={location.pathname === '/'} 
        onClick={onLinkClick}
      />
      <SidebarItem 
        to="/students" 
        icon={<Users size={20} />} 
        label="Students" 
        active={location.pathname === '/students'} 
        onClick={onLinkClick}
      />
      <SidebarItem 
        to="/statistics" 
        icon={<BarChart3 size={20} />} 
        label="Statistics" 
        active={location.pathname === '/statistics'} 
        onClick={onLinkClick}
      />
      <SidebarItem 
        to="/payments" 
        icon={<Wallet size={20} />} 
        label="Payments" 
        active={location.pathname === '/payments'} 
        onClick={onLinkClick}
      />
    </>
  );
};

export default App;
