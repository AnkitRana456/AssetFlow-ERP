import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sun, Moon, Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export function Navbar({ darkMode, setDarkMode }: NavbarProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  // Create breadcrumb segments
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-300">
      {/* Breadcrumb section */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/dashboard" className="hover:text-blue-500 transition-colors">Home</Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayLabel = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');

          return (
            <React.Fragment key={to}>
              <span className="text-slate-400 dark:text-slate-600">/</span>
              {isLast ? (
                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{displayLabel}</span>
              ) : (
                <Link to={to} className="hover:text-blue-500 transition-colors truncate max-w-[120px]">{displayLabel}</Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Alerts Bell */}
        <Link
          to="/notifications"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </Link>

        {/* Profile Info */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-blue-500/20">
              {user.firstName[0]}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.firstName}</p>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
