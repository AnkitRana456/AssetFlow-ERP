import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FolderKanban, Building2, CalendarDays, Wrench, ShieldAlert, Sparkles, User, 
  ArrowRight, ShieldCheck, Activity, Bell
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function DashboardPage() {
  const { user } = useAuthStore();

  const cards = [
    { name: 'Assets Directory', path: '/assets', icon: FolderKanban, desc: 'Register, decommission, search, and manage physical resource tags.', color: 'from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/20' },
    { name: 'Organization Setup', path: '/organization', icon: Building2, desc: 'Manage departments, asset categories, and system user promotion.', color: 'from-purple-600 to-pink-600 text-white hover:shadow-purple-500/20', adminOnly: true },
    { name: 'Bookings & Reservations', path: '/bookings', icon: CalendarDays, desc: 'Request asset allocations and book shared resource spaces.', color: 'from-emerald-600 to-teal-600 text-white hover:shadow-emerald-500/20' },
    { name: 'Maintenance Schedules', path: '/maintenance', icon: Wrench, desc: 'Initiate repairs, inspect equipment state, and schedule cycles.', color: 'from-amber-600 to-orange-600 text-white hover:shadow-amber-500/20' }
  ];

  const filteredCards = cards.filter(card => {
    if (card.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-[-30%] right-[-10%] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <Sparkles className="h-4.5 w-4.5" />
              AssetFlow Enterprise ERP
            </span>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Hello, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="text-sm text-slate-350 max-w-xl">
              Welcome back to your asset command center. Review allocations, monitor audit campaigns, and catalog new acquisitions.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Access Role</span>
                <span className="text-sm font-semibold text-slate-200">{user?.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          Active Workspaces
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCards.map((card, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link 
                to={card.path}
                className="h-full block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg border border-white/10 mb-4`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors flex items-center gap-1.5">
                  {card.name}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
