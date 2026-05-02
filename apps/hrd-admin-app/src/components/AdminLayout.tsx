import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, CalendarDays, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { initFCM } from '../lib/fcm';

const NAV = [
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/attendance', icon: CalendarDays, label: 'Attendance' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 flex-col bg-slate-900 border-r border-white/10 p-6 flex">
        <div className="mb-8">
          <h1 className="text-white font-bold text-xl">HRD Admin</h1>
          <p className="text-slate-400 text-sm mt-1">HR Management Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />{label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 text-sm transition-all"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
