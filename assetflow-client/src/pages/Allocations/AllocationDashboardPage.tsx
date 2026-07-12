import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, ArrowLeftRight, Clock, CheckCircle2, AlertTriangle, 
  X, HelpCircle, Eye, CornerRightDown, CornerRightUp, User, Ban, ArrowRight,
  ClipboardList, Image as ImageIcon, Check, Ban as BanIcon
} from 'lucide-react';
import { 
  useAllocations, useTransfers, useReturns,
  useApproveTransfer, useRejectTransfer, useCompleteTransfer,
  useApproveReturn, useRejectReturn 
} from '../../hooks/allocationHooks';
import { useCategories, useDepartments } from '../../hooks/orgHooks';
import { useAuthStore } from '../../store/useAuthStore';
import { AllocationFormDrawer } from './AllocationFormDrawer';
import { TransferRequestModal } from './TransferRequestModal';
import { ReturnRequestModal } from './ReturnRequestModal';

export function AllocationDashboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'allocations' | 'transfers' | 'returns'>('allocations');

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);

  // Drawer / Modals trigger states
  const [isAllocDrawerOpen, setIsAllocDrawerOpen] = useState(false);
  const [transferAsset, setTransferAsset] = useState<any | null>(null);
  const [returnAsset, setReturnAsset] = useState<any | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [rejectRemarksId, setRejectRemarksId] = useState<string | null>(null);
  const [rejectRemarksType, setRejectRemarksType] = useState<'transfer' | 'return' | null>(null);
  const [remarksText, setRemarksText] = useState('');

  // Queries
  const { data: allocationsData, isLoading: loadingAllocations } = useAllocations({
    search, status: statusFilter, department: deptFilter, category: catFilter, page, limit: 10
  });
  const { data: transfers, isLoading: loadingTransfers } = useTransfers();
  const { data: returns, isLoading: loadingReturns } = useReturns();
  
  const { data: categories } = useCategories({ limit: 100 });
  const { data: departments } = useDepartments({ limit: 100 });

  // Mutations
  const approveTransferMutation = useApproveTransfer();
  const rejectTransferMutation = useRejectTransfer();
  const completeTransferMutation = useCompleteTransfer();
  const approveReturnMutation = useApproveReturn();
  const rejectReturnMutation = useRejectReturn();

  // Handlers
  const handleRejectSubmit = () => {
    if (!rejectRemarksId || !remarksText.trim()) return;

    if (rejectRemarksType === 'transfer') {
      rejectTransferMutation.mutate({ id: rejectRemarksId, remarks: remarksText }, {
        onSuccess: () => {
          setRejectRemarksId(null);
          setRejectRemarksType(null);
          setRemarksText('');
        }
      });
    } else if (rejectRemarksType === 'return') {
      rejectReturnMutation.mutate({ id: rejectRemarksId, remarks: remarksText }, {
        onSuccess: () => {
          setRejectRemarksId(null);
          setRejectRemarksType(null);
          setRemarksText('');
        }
      });
    }
  };

  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  const isDeptHead = user?.role === 'DEPARTMENT_HEAD';

  // Kanban Columns
  const kanbanColumns = [
    { title: 'Pending Dept Approval', status: 'PENDING', bg: 'bg-slate-100 dark:bg-slate-900 border-slate-200' },
    { title: 'Dept Approved', status: 'DEPARTMENT_APPROVED', bg: 'bg-indigo-50/40 dark:bg-indigo-950/5 border-indigo-100/40' },
    { title: 'Manager Approved', status: 'ASSET_MANAGER_APPROVED', bg: 'bg-blue-50/40 dark:bg-blue-950/5 border-blue-100/40' },
    { title: 'Completed', status: 'COMPLETED', bg: 'bg-emerald-50/40 dark:bg-emerald-950/5 border-emerald-100/40' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Asset Allocations & Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Allocate devices, approve internal ownership transfers, track physical returns, and manage timelines.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsAllocDrawerOpen(true)}
            className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Allocate New Asset</span>
          </button>
        )}
      </div>

      {/* Overdue Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/10">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Active</span>
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white">
              {allocationsData?.stats?.totalActive ?? 0}
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/10 animate-pulse">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Overdue Returns</span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-500">
              {allocationsData?.stats?.totalOverdue ?? 0}
            </span>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/10">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Due Today</span>
            <span className="text-2xl font-extrabold text-amber-500">
              {allocationsData?.stats?.dueToday ?? 0}
            </span>
          </div>
        </div>

        {/* Due Tomorrow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/10">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Due Tomorrow</span>
            <span className="text-2xl font-extrabold text-indigo-500">
              {allocationsData?.stats?.dueTomorrow ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm max-w-md border">
        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'allocations' 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
              : 'text-slate-450 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Active Allocations
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'transfers' 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
              : 'text-slate-450 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Transfers Kanban
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'returns' 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
              : 'text-slate-450 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Return Inspections
        </button>
      </div>

      {/* Workspace Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-3xl shadow-sm p-6 overflow-hidden">
        
        {/* Tab 1: Active Allocations */}
        {activeTab === 'allocations' && (
          <div className="space-y-6">
            
            {/* Filter Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Asset, Tag, Employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="OVERDUE">Overdue</option>
                <option value="RETURNED">Returned</option>
              </select>

              {/* Department */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Departments</option>
                {departments?.data?.map((d: any) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>

              {/* Category */}
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Categories</option>
                {categories?.data?.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            {loadingAllocations ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs text-slate-400">Loading allocation roster...</p>
              </div>
            ) : allocationsData?.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <ClipboardList className="h-12 w-12 text-slate-400" />
                <h3 className="font-bold text-slate-850 dark:text-slate-200">No active allocations found</h3>
                <p className="text-xs text-slate-500 max-w-sm">No assignments matched your search terms or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-850">
                    <tr>
                      <th className="px-6 py-4">Asset Tag</th>
                      <th className="px-6 py-4">Asset Name</th>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Allocated Date</th>
                      <th className="px-6 py-4">Expected Return</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {allocationsData?.data?.map((alloc: any) => {
                      const overdue = alloc.status === 'OVERDUE';
                      return (
                        <tr key={alloc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                            {alloc.asset?.assetTag || 'N/A'}
                          </td>
                          <td className="px-6 py-4">{alloc.asset?.name || 'N/A'}</td>
                          <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                            {alloc.employee ? `${alloc.employee.firstName} ${alloc.employee.lastName}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4">{alloc.department?.name || 'N/A'}</td>
                          <td className="px-6 py-4">
                            {alloc.allocatedDate ? new Date(alloc.allocatedDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {alloc.expectedReturn ? new Date(alloc.expectedReturn).toLocaleDateString() : 'Indefinite'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              alloc.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : alloc.status === 'OVERDUE'
                                ? 'bg-rose-500/10 text-rose-500 animate-pulse'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {alloc.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/allocations/${alloc._id}`}
                                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded-xl transition-colors"
                                title="View History & Timeline"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              
                              {/* Request Transfer CTA */}
                              {(isManager || alloc.employee?._id === user?.userId) && alloc.status !== 'RETURNED' && (
                                <button
                                  onClick={() => setTransferAsset(alloc.asset)}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                                  title="Request Transfer"
                                >
                                  <ArrowLeftRight className="h-4 w-4" />
                                </button>
                              )}

                              {/* Request Return CTA */}
                              {(isManager || alloc.employee?._id === user?.userId) && alloc.status !== 'RETURNED' && (
                                <button
                                  onClick={() => setReturnAsset(alloc.asset)}
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors"
                                  title="Return Asset"
                                >
                                  <CornerRightDown className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transfers Kanban */}
        {activeTab === 'transfers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <span className="text-xs text-slate-400">
                Lanes represent transfer states. Double approval is required to reallocation.
              </span>
            </div>

            {loadingTransfers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs text-slate-400">Loading transfers workspace...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                {kanbanColumns.map((col, idx) => {
                  const filteredTransfers = transfers?.filter((t: any) => t.approvalStatus === col.status) || [];
                  return (
                    <div key={idx} className={`p-4 rounded-3xl border ${col.bg} flex flex-col min-h-[400px] max-h-[600px] overflow-y-auto space-y-4`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-550">{col.title}</h3>
                        <span className="text-[10px] bg-slate-200/50 dark:bg-slate-850 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                          {filteredTransfers.length}
                        </span>
                      </div>

                      {filteredTransfers.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-slate-250 dark:border-slate-800/80 rounded-2xl py-12 text-center">
                          <p className="text-[10px] text-slate-400">No requests</p>
                        </div>
                      ) : (
                        filteredTransfers.map((t: any) => {
                          const requestor = t.requestedBy?.firstName + ' ' + t.requestedBy?.lastName;
                          const sender = t.fromEmployee?.firstName + ' ' + t.fromEmployee?.lastName;
                          const receiver = t.toEmployee?.firstName + ' ' + t.toEmployee?.lastName;

                          return (
                            <div key={t._id} className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3 relative group hover:shadow-md transition-shadow">
                              <div>
                                <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                                  {t.asset?.assetTag}
                                </span>
                                <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 mt-2">{t.asset?.name}</h4>
                              </div>

                              <div className="text-[11px] space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">From Holder:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{sender}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">To Employee:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{receiver}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Dept Head Approval:</span>
                                  <span className={`font-semibold ${
                                    t.approvalStatus === 'PENDING' ? 'text-amber-500' : 'text-emerald-500'
                                  }`}>
                                    {t.approvalStatus === 'PENDING' ? 'Pending' : 'Approved'}
                                  </span>
                                </div>
                              </div>

                              {t.reason && (
                                <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-850/60 leading-relaxed italic">
                                  "{t.reason}"
                                </p>
                              )}

                              {/* Action Buttons based on roles and workflow state */}
                              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                
                                {/* Department Head approvals */}
                                {isDeptHead && t.approvalStatus === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => approveTransferMutation.mutate({ id: t._id })}
                                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <Check className="h-3 w-3" /> Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectRemarksId(t._id);
                                        setRejectRemarksType('transfer');
                                        setRemarksText('');
                                      }}
                                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px]"
                                    >
                                      <BanIcon className="h-3 w-3" />
                                    </button>
                                  </>
                                )}

                                {/* Asset Manager approvals */}
                                {isManager && (
                                  <>
                                    {t.approvalStatus === 'PENDING' || t.approvalStatus === 'DEPARTMENT_APPROVED' ? (
                                      <>
                                        <button
                                          onClick={() => approveTransferMutation.mutate({ id: t._id })}
                                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                                        >
                                          <Check className="h-3 w-3" /> Approve (Mgr)
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRejectRemarksId(t._id);
                                            setRejectRemarksType('transfer');
                                            setRemarksText('');
                                          }}
                                          className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10px]"
                                        >
                                          <BanIcon className="h-3 w-3" />
                                        </button>
                                      </>
                                    ) : null}

                                    {t.approvalStatus === 'ASSET_MANAGER_APPROVED' && (
                                      <button
                                        onClick={() => completeTransferMutation.mutate(t._id)}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-500/10 transition-colors"
                                      >
                                        Complete Reallocation <ArrowRight className="h-3 w-3" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Return Requests */}
        {activeTab === 'returns' && (
          <div className="space-y-6">
            {loadingReturns ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs text-slate-400">Loading pending returns...</p>
              </div>
            ) : returns?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <ClipboardList className="h-12 w-12 text-slate-400" />
                <h3 className="font-bold text-slate-850 dark:text-slate-200">No return requests found</h3>
                <p className="text-xs text-slate-500 max-w-sm">There are no pending returns that require review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {returns?.map((r: any) => {
                  const empName = r.employee?.firstName + ' ' + r.employee?.lastName;
                  return (
                    <div key={r._id} className="bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold px-2.5 py-1 rounded-full text-slate-650 dark:text-slate-350">
                          {r.asset?.assetTag}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          r.condition === 'EXCELLENT' || r.condition === 'GOOD'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : r.condition === 'MINOR_DAMAGE'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500 animate-pulse'
                        }`}>
                          Condition: {r.condition}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{r.asset?.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">Returned by: <strong className="text-slate-600 dark:text-slate-300">{empName}</strong></p>
                      </div>

                      {r.returnNotes && (
                        <p className="text-xs text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 italic">
                          "{r.returnNotes}"
                        </p>
                      )}

                      {/* Photo attachments lightboxes */}
                      {r.photos?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                          <div className="flex gap-1.5">
                            {r.photos.map((photo: any, index: number) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setLightboxImage(photo.url)}
                                className="h-8 w-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 hover:opacity-85 transition-opacity"
                              >
                                <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {isManager && r.status === 'PENDING' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                          <button
                            onClick={() => approveReturnMutation.mutate({ id: r._id })}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Check className="h-4 w-4" /> Inspect & Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectRemarksId(r._id);
                              setRejectRemarksType('return');
                              setRemarksText('');
                            }}
                            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Inspected by badge */}
                      {r.status !== 'PENDING' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-850 text-xs flex justify-between text-slate-400">
                          <span>Status:</span>
                          <span className={`font-bold ${r.status === 'APPROVED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {r.status}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Reject Remarks Modal Dialog */}
      <AnimatePresence>
        {rejectRemarksId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setRejectRemarksId(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden z-10"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reject Request Remarks</h3>
              <p className="text-xs text-slate-500 mt-1">Please provide a reason for rejecting this workflow request.</p>
              
              <textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                rows={3}
                placeholder="Enter rejection notes (e.g. Asset must be retained for project completion)..."
                className="w-full mt-4 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => {
                    setRejectRemarksId(null);
                    setRejectRemarksType(null);
                    setRemarksText('');
                  }}
                  className="px-4 py-2 rounded-lg border text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!remarksText.trim()}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  Reject Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[85vh] z-10 rounded-2xl overflow-hidden shadow-2xl border dark:border-slate-800"
            >
              <img src={lightboxImage} alt="Attachment Inspection" className="max-w-full max-h-[80vh] object-contain" />
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-2 bg-slate-950/80 rounded-full text-slate-350 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Allocations form drawer */}
      <AllocationFormDrawer
        isOpen={isAllocDrawerOpen}
        onClose={() => setIsAllocDrawerOpen(false)}
        onOpenTransfer={(asset) => setTransferAsset(asset)}
      />

      {/* Transfer form modal */}
      <TransferRequestModal
        isOpen={!!transferAsset}
        onClose={() => setTransferAsset(null)}
        asset={transferAsset}
      />

      {/* Return form modal */}
      <ReturnRequestModal
        isOpen={!!returnAsset}
        onClose={() => setReturnAsset(null)}
        asset={returnAsset}
      />

    </div>
  );
}

// Inline Calendar Icon fallback in case Lucide version varies
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
