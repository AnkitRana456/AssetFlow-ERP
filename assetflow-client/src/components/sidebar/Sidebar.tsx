import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Building2, FolderKanban, Users, ShieldAlert,
  CalendarDays, Wrench, FileSpreadsheet, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, ClipboardCheck, History
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logoutUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assets Directory', path: '/assets', icon: FolderKanban },
    { name: 'Organization Setup', path: '/organization', icon: Building2, roles: ['ADMIN'] },
    { name: 'Resource Bookings', path: '/bookings', icon: CalendarDays },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Auditing Campaigns', path: '/audit', icon: ClipboardCheck },
    { name: 'Activity Log', path: '/history', icon: History, roles: ['ADMIN'] },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <motion.div 
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 relative z-30 select-none shadow-xl"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              AF
            </span>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AssetFlow
            </span>
          </motion.div>
        )}
        {collapsed && (
          <div className="mx-auto h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            AF
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0 group-hover:scale-105 transition-transform" />
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="truncate"
              >
                {item.name}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Profile Card */}
      <div className="p-3 border-t border-slate-800">
        {user && !collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 mb-3 border border-slate-800/50">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold border border-indigo-500">
              {user.firstName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapsible toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute bottom-20 -right-3 h-6 w-6 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 items-center justify-center shadow-lg cursor-pointer"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.div>
  );
}
