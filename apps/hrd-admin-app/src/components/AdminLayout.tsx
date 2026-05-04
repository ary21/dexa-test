import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, CalendarDays, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { initFCM } from '../lib/fcm';

const NAV = [
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/attendance', icon: CalendarDays, label: 'Attendance' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    // US-22: Initialize FCM on admin app load
    initFCM((title, body) => {
      toast.info(`${title}: ${body}`, { duration: 6000 });
    }).catch(console.warn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-xl">HRD Admin</h1>
          <p className="text-slate-400 text-sm mt-1">HR Management Portal</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 text-sm transition-all"
      >
        <LogOut className="w-5 h-5" /> Sign Out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ─── Desktop Sidebar (always visible ≥md) ─────────────── */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-white/10 p-6 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Sidebar Drawer ─────────────────────────────── */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-white/10 p-6 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <SidebarContent />
      </aside>

      {/* ─── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-4 px-4 py-3 bg-slate-900 border-b border-white/10 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold">HRD Admin</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
