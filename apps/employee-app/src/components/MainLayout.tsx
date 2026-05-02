import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Clock, CalendarDays, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/attendance', icon: Clock, label: 'Attendance' },
  { to: '/summary', icon: CalendarDays, label: 'Summary' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-white/10 p-6">
        <div className="mb-8">
          <h1 className="text-white font-bold text-xl">AttendanceApp</h1>
          <p className="text-slate-400 text-sm mt-1">Employee Portal</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 text-sm font-medium transition-all"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-auto pb-20 md:pb-0">
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs font-medium transition-all ${
                isActive ? 'text-purple-400' : 'text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-3 text-xs font-medium text-slate-500 hover:text-red-400"
        >
          <LogOut className="w-5 h-5 mb-1" />
          Logout
        </button>
      </nav>
    </div>
  );
}
