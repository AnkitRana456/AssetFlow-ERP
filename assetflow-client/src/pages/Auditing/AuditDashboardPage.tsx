import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudits, useAuditDashboard, useStartAudit, useAuditAnalytics } from '../../hooks/auditHooks';
import { useDepartments } from '../../hooks/orgHooks';
import { AuditFormDrawer } from './AuditFormDrawer';
import { 
  ClipboardCheck, Plus, Search, AlertTriangle, Play, 
  ChevronRight, Calendar, Building, MapPin, Sparkles, CheckSquare, 
  ShieldAlert, Award, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';


export function AuditDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Dialog triggers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns');

  // Socket Connection for live updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('🔌 Connected to live audits channel');
      socket.emit('join_role', user?.role);
    });

    socket.on('audit_update', (data: any) => {
      console.log('⚡ Live audit update received:', data);
      refetchDashboard();
      refetchList();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Queries
  const { data: dashboardData, refetch: refetchDashboard } = useAuditDashboard();
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: analyticsData } = useAuditAnalytics();
  
  const { data: auditsList, refetch: refetchList, isLoading } = useAudits({
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    department: departmentFilter || undefined,
    limit: 105
  });


  const startMutation = useStartAudit();

  const handleStartCampaign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent row click navigation
    if (confirm('Are you sure you want to start this audit campaign? In-scope assets will be locked into verification checklist.')) {
      startMutation.mutate(id, {
        onSuccess: () => {
          refetchList();
          refetchDashboard();
        }
      });
    }
  };

  const handleRowClick = (audit: any) => {
    if (audit.status === 'DRAFT' || audit.status === 'SCHEDULED') {
      // Admins/Managers can start it, or employees can view
      navigate(`/audit/${audit._id}`);
    } else {
      navigate(`/audit/${audit._id}`);
    }
  };

  // Helper colors
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
      case 'SCHEDULED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CLOSED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  const db = dashboardData || {
    totalAudits: 0,
    running: 0,
    completed: 0,
    verifiedAssets: 0,
    missingAssets: 0,
    damagedAssets: 0,
    pendingVerification: 0
  };

  const isAdminOrMgr = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] h-[200px] w-[200px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              Audits & Compliance
            </span>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-indigo-400" />
              Asset Audit & Physical Verification
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Conduct inventory verifications, map discrepancy logs, run sampling controls, and resolve asset statuses against actual configurations.
            </p>
          </div>

          {isAdminOrMgr && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all self-start sm:self-center"
            >
              <Plus className="h-4.5 w-4.5" />
              Create Audit Cycle
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaigns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Audit Cycles</span>
            <span className="text-xl font-extrabold text-slate-850 dark:text-slate-100">{db.totalAudits}</span>
            <p className="text-[9px] text-slate-500">{db.running} active, {db.completed} closed</p>
          </div>
          <div className="h-9.5 w-9.5 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Pending items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pending Verifies</span>
            <span className="text-xl font-extrabold text-slate-855 dark:text-slate-100">{db.pendingVerification}</span>
            <p className="text-[9px] text-slate-500">Unverifed scoped items</p>
          </div>
          <div className="h-9.5 w-9.5 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        {/* Missing count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Missing Logs</span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-500">{db.missingAssets}</span>
            <p className="text-[9px] text-rose-500/80">Pending lost confirmations</p>
          </div>
          <div className="h-9.5 w-9.5 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        {/* Damaged count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Damaged Logs</span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-500">{db.damagedAssets}</span>
            <p className="text-[9px] text-amber-500/80">Physical damage recorded</p>
          </div>
          <div className="h-9.5 w-9.5 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'campaigns'
              ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          Verification Campaigns
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          Compliance Analytics
        </button>
      </div>

      {activeTab === 'campaigns' ? (
        /* Filters & Workspace Campaigns List */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          
          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search audit name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-700 dark:text-slate-350 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-700 dark:text-slate-355 focus:outline-none"
              >
                <option value="">All Departments</option>
                {departmentsData?.data?.map((dept: any) => (
                  <option key={dept._id} value={dept._id}>{dept.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campaign List Grid/Table */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Fetching active campaigns...
            </div>
          ) : (!auditsList?.audits || auditsList.audits.length === 0) ? (
            <div className="p-12 text-center text-slate-400 italic text-xs">
              No audit campaigns registered in scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-3">
                    <th className="py-3 px-4">Audit Cycle</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Department/Location</th>
                    <th className="py-3 px-3">Timeline</th>
                    <th className="py-3 px-3 text-center">Priority</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {auditsList.audits.map((audit: any) => (
                    <tr 
                      key={audit._id}
                      onClick={() => handleRowClick(audit)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors cursor-pointer group text-xs text-slate-800 dark:text-slate-200"
                    >
                      <td className="py-4.5 px-4 font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                        {audit.title}
                        {audit.description && (
                          <p className="text-[10px] text-slate-450 font-normal mt-0.5 max-w-sm truncate">{audit.description}</p>
                        )}
                      </td>
                      <td className="py-4.5 px-3">
                        <span className="font-semibold">{audit.type.replace('_', ' ')}</span>
                      </td>
                      <td className="py-4.5 px-3">
                        {audit.department ? (
                          <span className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5 text-slate-400" />
                            {audit.department.code}
                          </span>
                        ) : audit.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {audit.location}
                          </span>
                        ) : (
                          <span className="text-slate-400">All Scope</span>
                        )}
                      </td>
                      <td className="py-4.5 px-3 font-semibold text-slate-550 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4.5 px-3 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getPriorityStyle(audit.priority)}`}>
                          {audit.priority}
                        </span>
                      </td>
                      <td className="py-4.5 px-3 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getStatusStyle(audit.status)}`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {isAdminOrMgr && (audit.status === 'DRAFT' || audit.status === 'SCHEDULED') && (
                            <button
                              onClick={(e) => handleStartCampaign(e, audit._id)}
                              className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </button>
                          )}
                          <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Analytics Tab View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Status Distribution (PieChart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-indigo-500" />
              Verified Asset Accuracy Status
            </h3>
            <div className="h-64 flex items-center justify-center">
              {(!analyticsData?.statusTotals || analyticsData.statusTotals.length === 0) ? (
                <p className="text-xs text-slate-450 italic">No verification records generated yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.statusTotals}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analyticsData.statusTotals.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Monthly Audits Trend (AreaChart) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
              Audit Cycles Launch Trend (Last 6 Months)
            </h3>
            <div className="h-64 w-full text-xs">
              {(!analyticsData?.monthlyAudits || analyticsData.monthlyAudits.length === 0) ? (
                <p className="text-xs text-slate-450 italic text-center py-20">No monthly trends computed.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyAudits} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAudits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Audits" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAudits)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Departmental Compliance (BarChart) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-4.5 w-4.5 text-indigo-500" />
              Departmental Asset Verification Compliance Rate (%)
            </h3>
            <div className="h-64 w-full text-xs">
              {(!analyticsData?.complianceByDept || analyticsData.complianceByDept.length === 0) ? (
                <p className="text-xs text-slate-450 italic text-center py-20">No departmental compliance computed.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.complianceByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="department" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="Compliance" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Audit Drawer creation overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <AuditFormDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              refetchList();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
