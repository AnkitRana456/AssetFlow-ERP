import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Building2, FolderKanban,
  CalendarDays, Wrench, FileSpreadsheet, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, ClipboardCheck, History, ArrowLeftRight
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
    { name: 'Asset Allocations', path: '/allocations', icon: ArrowLeftRight },
    { name: 'Organization Setup', path: '/organization', icon: Building2, roles: ['ADMIN'] },

    { name: 'Resource Bookings', path: '/bookings', icon: CalendarDays },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Auditing Campaigns', path: '/audit', icon: ClipboardCheck },
    { name: 'Reports Hub', path: '/reports', icon: FileSpreadsheet },
    { name: 'Activity Log', path: '/logs', icon: History, roles: ['ADMIN'] },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];


  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <motion.div 
      animate={{ width: collapsed ? 76 : 270 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen bg-slate-950/95 text-slate-100 flex flex-col border-r border-slate-900 relative z-30 select-none shadow-2xl transition-colors duration-300"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-900 bg-slate-950/40">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-500/20">
              AF
            </span>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-slate-150 to-slate-200 bg-clip-text text-transparent">
              AssetFlow
            </span>
          </motion.div>
        )}
        {collapsed && (
          <div className="mx-auto h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-500/15">
            AF
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-slate-900 border-l-2 border-blue-500 text-white shadow-sm shadow-black/20' 
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0 group-hover:scale-105 transition-transform duration-200" />
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
      <div className="p-4 border-t border-slate-900 bg-slate-950/40">
        {user && !collapsed && (
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/40 mb-3 border border-slate-900/50 shadow-inner">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
              {user.firstName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-100">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-500 tracking-wider uppercase font-bold mt-0.5">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-350 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapsible toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute bottom-24 -right-3 h-6 w-6 rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 items-center justify-center shadow-lg hover:bg-slate-850 cursor-pointer"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </motion.div>
  );
}
