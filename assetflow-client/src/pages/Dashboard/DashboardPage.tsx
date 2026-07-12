import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Calendar, Wrench, CheckCircle, 
  TrendingUp, Clock, Activity, FileText, AlertTriangle 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useExecutiveStats } from '../../hooks/enterpriseHooks';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { io } from 'socket.io-client';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, refetch } = useExecutiveStats();

  // Socket Connection for live updates on dashboard parameters
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('🔌 Connected to live executive stream');
    });

    socket.on('dashboard_update', () => {
      console.log('⚡ Executive stats updated live');
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live executive summary...</span>
        </div>
      </div>
    );
  }

  const { counts, categoryDistribution, departmentAllocation, monthlyGrowth, maintenanceTrend, heatmapData } = data;

  const cardItems = [
    { name: 'Total Assets', value: counts.totalAssets, icon: Activity, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Available', value: counts.available, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Allocated', value: counts.allocated, icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
    { name: 'Under Maintenance', value: counts.maintenance, icon: Wrench, color: 'text-amber-500 bg-amber-500/10' },
    { name: 'Overdue Returns', value: counts.overdueAssets, icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' },
    { name: 'Bookings Today', value: counts.bookingsToday, icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
    { name: 'Open Repairs', value: counts.openMaintenance, icon: Clock, color: 'text-orange-500 bg-orange-500/10' },
    { name: 'Running Audits', value: counts.runningAudits, icon: FileText, color: 'text-teal-500 bg-teal-500/10' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <TrendingUp className="h-4.5 w-4.5" />
              Live Executive Dashboard
            </span>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Real-time monitoring of corporate inventories, compliance levels, and maintenance repair operations.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-800/80 border border-slate-700/50 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="h-9 w-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <CheckCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Server Status</span>
                <span className="text-xs font-bold text-slate-200">LIVE & SYNCED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardItems.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-300"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.name}</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{item.value}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="h-6 w-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Asset Category Distribution
          </h3>
          <div className="h-[260px] w-full flex items-center justify-center">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Assets`, 'Count']} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No categories scoped.</span>
            )}
          </div>
        </div>

        {/* Department Allocation Bar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-500" />
            Departmental Custody Ratios
          </h3>
          <div className="h-[260px] w-full">
            {departmentAllocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentAllocation}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No allocations completed.</span>
            )}
          </div>
        </div>

        {/* Growth Curve Area */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Asset Acquisitions Trend
          </h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyGrowth}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="Assets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Cost Bar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-500" />
            Monthly Maintenance Repair Cost Summary
          </h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Bar dataKey="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Booking Usage Heatmap */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-500" />
          Resource Booking usage Density (Heatmap)
        </h3>
        <p className="text-xs text-slate-450 mb-6">Visualizes peak days and booking hours to optimize equipment availability.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 font-semibold text-xs uppercase">
                <th className="py-2.5 px-4">Day</th>
                <th className="py-2.5 px-4 text-center">Morning (8am-12pm)</th>
                <th className="py-2.5 px-4 text-center">Afternoon (12pm-4pm)</th>
                <th className="py-2.5 px-4 text-center">Evening (4pm-8pm)</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row: any, idx: number) => {
                const getHeatColor = (val: number) => {
                  if (val === 0) return 'bg-slate-50 dark:bg-slate-900/50 text-slate-400';
                  if (val <= 2) return 'bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-bold';
                  if (val <= 5) return 'bg-purple-300 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 font-extrabold';
                  return 'bg-purple-500 text-white font-black animate-pulse';
                };

                return (
                  <tr key={idx} className="border-b border-slate-150/40 dark:border-slate-850">
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-350">{row.day}</td>
                    <td className="py-2.5 px-4 text-center">
                      <div className={`py-2 px-4 rounded-xl text-xs mx-auto max-w-[120px] ${getHeatColor(row['Morning (8am-12pm)'])}`}>
                        {row['Morning (8am-12pm)']} Bookings
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className={`py-2 px-4 rounded-xl text-xs mx-auto max-w-[120px] ${getHeatColor(row['Afternoon (12pm-4pm)'])}`}>
                        {row['Afternoon (12pm-4pm)']} Bookings
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className={`py-2 px-4 rounded-xl text-xs mx-auto max-w-[120px] ${getHeatColor(row['Evening (4pm-8pm)'])}`}>
                        {row['Evening (4pm-8pm)']} Bookings
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
