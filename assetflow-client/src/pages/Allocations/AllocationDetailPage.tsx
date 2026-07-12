import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, Info, CheckCircle2, 
  Clock, AlertTriangle, ArrowRightLeft, CornerRightDown,
  Plus, Cpu
} from 'lucide-react';


import { useAllocationDetail, useAssetTimeline } from '../../hooks/allocationHooks';

export function AllocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: allocation, isLoading: loadingAllocation } = useAllocationDetail(id || '');

  // Fetch timeline using the asset ID from the allocation details
  const assetId = allocation?.asset?._id;
  const { data: timelineEvents, isLoading: loadingTimeline } = useAssetTimeline(assetId || '');

  if (loadingAllocation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-555">Loading allocation record...</p>
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Allocation Record Not Found</h3>
        <Link to="/allocations" className="text-blue-500 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const asset = allocation.asset;
  const employee = allocation.employee;
  const department = allocation.department;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Back Link */}
      <div>
        <Link 
          to="/allocations" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Allocations Dashboard
        </Link>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1/3: Allocation & Asset Specifications */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Allocation Spec Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Allocation Details
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  allocation.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : allocation.status === 'OVERDUE'
                    ? 'bg-rose-500/10 text-rose-500 animate-pulse'
                    : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {allocation.status}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Purpose</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-1">{allocation.purpose || 'General Assignment'}</span>
              </div>

              {allocation.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Allocation Notes</span>
                  <p className="text-slate-600 dark:text-slate-400 block mt-1 leading-relaxed">{allocation.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-1">
                    {allocation.allocatedDate ? new Date(allocation.allocatedDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Return</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-1">
                    {allocation.expectedReturn ? new Date(allocation.expectedReturn).toLocaleDateString() : 'Indefinite'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              Asset Properties
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-blue-600">
                  {asset?.category?.name ? asset.category.name[0] : 'A'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{asset?.name}</span>
                  <span className="text-xs text-slate-455 block">{asset?.assetTag}</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-400">Serial Number:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{asset?.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{asset?.category?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Condition:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{asset?.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location Tag:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{asset?.location || 'Staging Area'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Employee Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-500" />
              Custodian Information
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-350">
                  {employee ? employee.firstName[0] : 'U'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-455 block">{employee?.employeeId}</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350 text-right truncate max-w-[180px]">{employee?.email}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 2/3: Beautiful Animated Vertical Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
              Asset Lifecycle Timeline
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Historical ledger of physical reallocations, reviews, and updates in Odoo-style chronological order.
            </p>
          </div>

          {loadingTimeline ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-6 w-6 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400">Compiling asset ledger history...</p>
            </div>
          ) : !timelineEvents || timelineEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Clock className="h-10 w-10 text-slate-350" />
              <h4 className="font-bold text-slate-850 dark:text-slate-300">No events logged yet</h4>
              <p className="text-xs text-slate-500 max-w-xs">This asset hasn't generated any transaction logs or allocations since creation.</p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="relative border-l border-slate-200 dark:border-slate-800 pl-8 ml-4 space-y-8 py-4"
            >
              <AnimatePresence>
                {timelineEvents.map((event: any, index: number) => {
                  const date = event.createdAt ? new Date(event.createdAt).toLocaleString() : 'N/A';
                  
                  // Map event action type to specific style configs
                  let badgeColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                  let icon = <Info className="h-4 w-4" />;
                  
                  if (event.action === 'ALLOCATED') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                    icon = <CheckCircle2 className="h-4 w-4" />;
                  } else if (event.action.startsWith('TRANSFER')) {
                    badgeColor = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
                    icon = <ArrowRightLeft className="h-4 w-4" />;
                  } else if (event.action.startsWith('RETURN') || event.action === 'RETURNED') {
                    badgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                    icon = <CornerRightDown className="h-4 w-4" />;
                  } else if (event.action === 'OVERDUE') {
                    badgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                    icon = <AlertTriangle className="h-4 w-4" />;
                  } else if (event.action === 'CREATED') {
                    badgeColor = 'bg-purple-500/10 text-purple-500 border-purple-500/20';
                    icon = <Plus className="h-4 w-4" />;
                  } else if (event.action === 'DAMAGED' || event.action === 'LOST') {
                    badgeColor = 'bg-red-500/10 text-red-500 border-red-500/20';
                    icon = <AlertTriangle className="h-4 w-4" />;
                  }

                  const actorName = event.performedBy 
                    ? `${event.performedBy.firstName} ${event.performedBy.lastName}` 
                    : 'System Scheduler';

                  return (
                    <motion.div 
                      key={event._id || index}
                      variants={itemVariants}
                      className="relative space-y-2 group"
                    >
                      {/* Node point marker */}
                      <span className={`absolute -left-12 top-1.5 h-8 w-8 rounded-full flex items-center justify-center border bg-white dark:bg-slate-900 ${badgeColor} shadow-sm group-hover:scale-110 transition-transform duration-200 z-10`}>
                        {icon}
                      </span>

                      {/* Event description card */}
                      <div className="bg-slate-50/70 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl transition-colors duration-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {event.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-550 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {date}
                          </span>
                        </div>
                        
                        <p className="text-sm font-semibold text-slate-850 dark:text-slate-100 mt-2 leading-relaxed">
                          {event.details}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40 text-xs text-slate-455">
                          <span className="h-4.5 w-4.5 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-[10px] font-bold">
                            {actorName[0]}
                          </span>
                          <span>Performed by: <strong>{actorName}</strong> ({event.performedBy?.role ? event.performedBy.role.replace('_', ' ') : 'SYSTEM'})</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
