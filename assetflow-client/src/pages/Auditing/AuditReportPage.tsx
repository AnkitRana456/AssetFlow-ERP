import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuditDetail, useCloseAudit } from '../../hooks/auditHooks';
import { auditService } from '../../services/auditService';
import { 
  AlertTriangle, ArrowLeft, Sparkles, MapPin, 
  Lock, Download, Activity
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';


export function AuditReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const { data: auditData, isLoading, refetch: refetchDetail } = useAuditDetail(id || '');
  const closeMutation = useCloseAudit();

  // Load report data
  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ['auditReport', id],
    queryFn: () => auditService.getAuditReport(id as string),
    enabled: !!id
  });

  // Close Modal trigger
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (isLoading || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold font-mono">Running discrepancy compiler...</span>
      </div>
    );
  }

  const audit = auditData?.audit;

  // Handle Download CSV
  const handleDownloadCSV = () => {
    auditService.getAuditReport(id as string, 'csv')
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Discrepancy_Report_${audit.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      })
      .catch((err) => {
        alert('Failed to generate CSV export');
        console.error(err);
      });
  };

  // Close Audit submit
  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes) return;

    closeMutation.mutate({
      id: id as string,
      data: { resolutionNotes }
    }, {
      onSuccess: () => {
        setIsCloseModalOpen(false);
        refetchDetail();
        refetchReport();
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || 'Failed to close audit cycle');
      }
    });
  };

  const isClosed = audit.status === 'CLOSED';
  const canClose = (currentUser?.role === 'ADMIN' || currentUser?.role === 'ASSET_MANAGER') && audit.status !== 'CLOSED';

  // Compliance scores
  const totals = report.totals || {};
  const discrepancies = report.discrepancies || {
    missingAssets: [],
    damagedAssets: [],
    unexpectedAssets: [],
    wrongLocation: [],
    wrongDepartment: [],
    wrongHolder: []
  };

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/audit')}
          className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Campaigns List
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2"
          >
            <Download className="h-4.5 w-4.5 text-indigo-500" />
            Download CSV Audit Log
          </button>

          {canClose && (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
            >
              <Lock className="h-4.5 w-4.5" />
              Lock & Close Campaign
            </button>
          )}
        </div>
      </div>

      {/* Audit timeline details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 uppercase shrink-0">
              {audit.status}
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1.5">{audit.title} Report</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Compliance Accuracy</span>
            <span className="text-2xl font-extrabold text-emerald-500">{totals.complianceRate}%</span>
          </div>
        </div>

        {/* Horizontal Timeline steps */}
        <div className="grid grid-cols-5 text-center gap-2 pt-2 relative select-none">
          {[
            { label: 'Created', active: true },
            { label: 'Scheduled', active: audit.status !== 'DRAFT' },
            { label: 'Started', active: audit.status === 'IN_PROGRESS' || audit.status === 'COMPLETED' || audit.status === 'CLOSED' },
            { label: 'Verification', active: audit.status === 'COMPLETED' || audit.status === 'CLOSED' },
            { label: 'Closed', active: audit.status === 'CLOSED' }
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col items-center relative">
              <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center font-bold text-xs z-10 ${
                step.active 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}>
                {idx + 1}
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2 block">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Notes Section if Closed */}
      {isClosed && (
        <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-3xl space-y-2">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block flex items-center gap-1">
            <Lock className="h-4 w-4" />
            Audit Closure & Resolution Details
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
            {audit.resolutionNotes || 'No closure notes provided.'}
          </p>
          <span className="text-[9px] text-slate-450 block pt-1">
            Reviewed and Locked By: {audit.closedBy?.firstName} {audit.closedBy?.lastName} on {new Date(audit.closedAt).toLocaleString()}
          </span>
        </div>
      )}

      {/* Discrepancy Breakdown Sections */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wide">
          <Activity className="h-4.5 w-4.5 text-indigo-500" />
          Discrepancy Details Breakdown
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Missing Assets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-rose-500" /> Confirmed Missing Assets</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500">{discrepancies.missingAssets.length}</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-56 overflow-y-auto pr-1">
              {discrepancies.missingAssets.map((item: any) => (
                <div key={item._id} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-850 dark:text-slate-300 truncate">{item.asset?.name}</p>
                    <span className="text-[9px] text-slate-450 font-mono uppercase">{item.asset?.assetTag}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.auditorNotes || 'No notes'}</span>
                </div>
              ))}
              {discrepancies.missingAssets.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No missing assets recorded.</p>
              )}
            </div>
          </div>

          {/* 2. Damaged Assets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Physical Damage Recorded</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">{discrepancies.damagedAssets.length}</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-56 overflow-y-auto pr-1">
              {discrepancies.damagedAssets.map((item: any) => (
                <div key={item._id} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-850 dark:text-slate-300 truncate">{item.asset?.name}</p>
                    <span className="text-[9px] text-slate-450 font-mono uppercase">{item.asset?.assetTag}</span>
                  </div>
                  <span className="text-[10px] text-amber-550 dark:text-amber-500 font-semibold">{item.auditorNotes || 'No notes'}</span>
                </div>
              ))}
              {discrepancies.damagedAssets.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No physical damage recorded.</p>
              )}
            </div>
          </div>

          {/* 3. Unexpected Scans */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-purple-500" /> Unexpected Assets Scans</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">{discrepancies.unexpectedAssets.length}</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-56 overflow-y-auto pr-1">
              {discrepancies.unexpectedAssets.map((item: any) => (
                <div key={item._id} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-850 dark:text-slate-300 truncate">{item.asset?.name}</p>
                    <span className="text-[9px] text-slate-450 font-mono uppercase">{item.asset?.assetTag}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.auditorNotes || 'No notes'}</span>
                </div>
              ))}
              {discrepancies.unexpectedAssets.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No unexpected scans registered.</p>
              )}
            </div>
          </div>

          {/* 4. Wrong Location Mismatch */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-indigo-500" /> Mismatched Location Mappings</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-550/10 text-indigo-500">{discrepancies.wrongLocation.length}</span>
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-56 overflow-y-auto pr-1">
              {discrepancies.wrongLocation.map((item: any) => (
                <div key={item._id} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-850 dark:text-slate-300 truncate">{item.asset?.name}</p>
                    <span className="text-[9px] text-slate-450 font-mono uppercase">{item.asset?.assetTag}</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-semibold">Location: {item.asset?.location || 'N/A'}</span>
                </div>
              ))}
              {discrepancies.wrongLocation.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No location mismatches resolved.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lock Campaign Confirmation Dialog */}
      <AnimatePresence>
        {isCloseModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCloseModalOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Lock & Close Audit Cycle</h3>
              </div>

              <form onSubmit={handleCloseSubmit} className="space-y-4">
                <p className="text-[11px] text-slate-500 leading-normal">
                  Locking the campaign resolves discrepancy discrepancies, sets asset conditions, and updates statuses. This action is irreversible.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Resolution and Audit Notes</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide comments on overall compliance findings, discrepancies resolved, and resolutions approved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs focus:outline-none focus:border-blue-500 h-28 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCloseModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={closeMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {closeMutation.isPending && (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Approve & Lock Audit
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
