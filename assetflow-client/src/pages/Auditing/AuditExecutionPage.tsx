import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuditDetail, useVerifyAsset, useBulkVerifyAssets, useStartAudit } from '../../hooks/auditHooks';
import { 
  X, AlertTriangle, ArrowLeft, ScanLine, 
  ClipboardList, Package, Clock, Eye, CheckCircle2,
  CheckSquare, AlertCircle
} from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

export function AuditExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const { data: auditData, isLoading, refetch: refetchAudit } = useAuditDetail(id || '');
  const verifyMutation = useVerifyAsset();
  const bulkVerifyMutation = useBulkVerifyAssets();
  const startMutation = useStartAudit();

  // Selected items for bulk actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedTagInput, setScannedTagInput] = useState('');
  const [scannerFeedback, setScannerFeedback] = useState<{ type: 'SUCCESS' | 'ERROR' | 'WARN'; msg: string } | null>(null);

  // Verification dialog
  const [activeVerifyItem, setActiveVerifyItem] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatusSelect, setVerificationStatusSelect] = useState<'VERIFIED' | 'MISSING' | 'DAMAGED' | 'DISPOSED' | 'DUPLICATE'>('VERIFIED');

  // Socket updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('join_user', currentUser?.userId);
    });

    socket.on('verification_progress', (data: any) => {
      if (data.auditId === id) {
        console.log('⚡ Verification progress received:', data);
        refetchAudit();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold font-mono">Resolving scoping blocks...</span>
      </div>
    );
  }

  const audit = auditData?.audit;
  const items = auditData?.items || [];

  if (!audit) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Audit Cycle Not Found</h2>
        <button onClick={() => navigate('/audit')} className="px-4 py-2 bg-slate-100 dark:bg-slate-850 text-xs font-bold rounded-xl cursor-pointer">
          Back to Audits
        </button>
      </div>
    );
  }

  // Redirect to report view if Closed or Completed
  if (audit.status === 'CLOSED' || audit.status === 'COMPLETED') {
    navigate(`/audit/${id}/report`);
  }

  // Compute local metrics
  const totals = {
    total: items.filter((i: any) => !i.isUnexpected).length,
    verified: items.filter((i: any) => i.verificationStatus === 'VERIFIED').length,
    missing: items.filter((i: any) => i.verificationStatus === 'MISSING').length,
    damaged: items.filter((i: any) => i.verificationStatus === 'DAMAGED').length,
    pending: items.filter((i: any) => i.verificationStatus === 'PENDING').length,
    unexpected: items.filter((i: any) => i.isUnexpected).length
  };

  const complianceRate = totals.total > 0 
    ? Math.round(((totals.verified + totals.damaged) / totals.total) * 100) 
    : 100;

  // Verify single item trigger
  const handleVerifyClick = (item: any) => {
    setActiveVerifyItem(item);
    setVerificationStatusSelect(item.verificationStatus === 'PENDING' ? 'VERIFIED' : item.verificationStatus);
    setVerificationNotes(item.auditorNotes || '');
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVerifyItem) return;

    verifyMutation.mutate({
      auditId: id as string,
      data: {
        assetId: activeVerifyItem.asset._id,
        verificationStatus: verificationStatusSelect,
        auditorNotes: verificationNotes
      }
    }, {
      onSuccess: () => {
        setActiveVerifyItem(null);
        refetchAudit();
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || 'Failed to submit verification');
      }
    });
  };

  // Bulk verifications
  const handleBulkAction = (status: 'VERIFIED' | 'MISSING' | 'DAMAGED') => {
    if (selectedItemIds.length === 0) return;
    
    if (confirm(`Do you want to bulk mark ${selectedItemIds.length} items as ${status}?`)) {
      bulkVerifyMutation.mutate({
        auditId: id as string,
        data: {
          itemIds: selectedItemIds,
          verificationStatus: status,
          auditorNotes: 'Bulk updated by auditor.'
        }
      }, {
        onSuccess: () => {
          setSelectedItemIds([]);
          refetchAudit();
        },
        onError: (err: any) => {
          alert(err.response?.data?.message || 'Bulk verify failed');
        }
      });
    }
  };

  // QR Code Scanner simulate submit
  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScannerFeedback(null);
    if (!scannedTagInput) return;

    const inputUpper = scannedTagInput.trim().toUpperCase();

    // 1. Search locally in checklist items first
    const matchedItem = items.find((item: any) => {
      const asset = item.asset || {};
      return (
        (asset.assetTag && asset.assetTag.toUpperCase() === inputUpper) ||
        (asset.barcode && asset.barcode.toUpperCase() === inputUpper) ||
        (asset.qrCode && asset.qrCode.toUpperCase() === inputUpper)
      );
    });

    if (matchedItem) {
      // Automatically open asset in verification drawer!
      setIsScannerOpen(false);
      handleVerifyClick(matchedItem);
      setScannedTagInput('');
    } else {
      // Scanned code not found in original scope -> call backend verification to register as unexpected item!
      verifyMutation.mutate({
        auditId: id as string,
        data: {
          scannedCode: inputUpper,
          verificationStatus: 'VERIFIED',
          auditorNotes: 'Scanned during audit campaign (Unexpected item scan).'
        }
      }, {
        onSuccess: (res: any) => {
          setScannerFeedback({ 
            type: 'WARN', 
            msg: `Unexpected Scan: Asset "${res.asset?.name || scannedTagInput}" is not in original audit scope. Registered as UNEXPECTED.` 
          });
          setScannedTagInput('');
          refetchAudit();
          // Automatically open this new item's drawer after a brief delay
          setTimeout(() => {
            setIsScannerOpen(false);
            refetchAudit().then((freshData: any) => {
              const freshItems = freshData.data?.items || [];
              const freshMatch = freshItems.find((i: any) => i.asset?._id === res.asset?._id);
              if (freshMatch) {
                handleVerifyClick(freshMatch);
              }
            });
          }, 1500);
        },
        onError: (err: any) => {
          setScannerFeedback({ type: 'ERROR', msg: err.response?.data?.message || 'Scanning resolution failed.' });
        }
      });
    }
  };


  // Start campaign
  const handleStartCampaign = () => {
    startMutation.mutate(id as string, {
      onSuccess: () => {
        refetchAudit();
      }
    });
  };

  const isAuditInProgress = audit.status === 'IN_PROGRESS';
  const isAuditor = audit.auditors.some((a: any) => a._id === currentUser?.userId) || currentUser?.role === 'ADMIN' || currentUser?.role === 'ASSET_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/audit')}
          className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Audits Campaigns
        </button>

        <div className="flex gap-2">
          {audit.status === 'DRAFT' && isAuditor && (
            <button
              onClick={handleStartCampaign}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
              Activate Campaign
            </button>
          )}

          {isAuditInProgress && isAuditor && (
            <button
              onClick={() => {
                setScannerFeedback(null);
                setScannedTagInput('');
                setIsScannerOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
            >
              <ScanLine className="h-4.5 w-4.5 animate-pulse" />
              QR / Barcode Scanner
            </button>
          )}

          {/* Report redirect button */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ASSET_MANAGER') && (
            <button
              onClick={() => navigate(`/audit/${id}/report`)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2"
            >
              <Eye className="h-4.5 w-4.5" />
              Discrepancy Report
            </button>
          )}
        </div>
      </div>

      {/* Campaign Details Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] h-[200px] w-[200px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              {audit.status}
            </span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
              Type: {audit.type.replace('_', ' ')}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight leading-snug">{audit.title}</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {audit.description || 'No description listed for this verification campaign.'}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-400 border-t border-slate-800/80 pt-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <strong>Due Date:</strong> {new Date(audit.endDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              <strong>Total Scoped:</strong> {totals.total} Assets
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <strong>Compliance Accuracy:</strong> {complianceRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Auditor Statistics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Checklist Size', count: totals.total, color: 'text-slate-800 dark:text-slate-200' },
          { label: 'Verified', count: totals.verified, color: 'text-emerald-500 font-bold' },
          { label: 'Missing', count: totals.missing, color: 'text-rose-500 font-bold' },
          { label: 'Damaged', count: totals.damaged, color: 'text-amber-500 font-bold' },
          { label: 'Pending Audit', count: totals.pending, color: 'text-slate-400' },
          { label: 'Unexpected Scans', count: totals.unexpected, color: 'text-purple-500 font-bold' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
            <span className={`text-xl font-extrabold mt-1 block ${stat.color}`}>{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Checklist Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-850">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-indigo-500" />
            Checklist Assets Scope
          </h3>

          {/* Bulk verifications options bar */}
          {selectedItemIds.length > 0 && isAuditInProgress && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 bg-indigo-550/5 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/10"
            >
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mr-2 uppercase tracking-wide">
                Bulk ({selectedItemIds.length}) :
              </span>
              <button
                onClick={() => handleBulkAction('VERIFIED')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[9px] cursor-pointer"
              >
                Mark Verified
              </button>
              <button
                onClick={() => handleBulkAction('MISSING')}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[9px] cursor-pointer"
              >
                Mark Missing
              </button>
              <button
                onClick={() => handleBulkAction('DAMAGED')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[9px] cursor-pointer"
              >
                Mark Damaged
              </button>
            </motion.div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-3">
                {isAuditInProgress && <th className="py-3 px-3"><input type="checkbox" onChange={(e) => {
                  if (e.target.checked) setSelectedItemIds(items.map((i: any) => i._id));
                  else setSelectedItemIds([]);
                }} /></th>}
                <th className="py-3 px-3">Asset</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Recorded Department</th>
                <th className="py-3 px-3">Recorded Location</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Discrepancy</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {items.map((item: any) => {
                const asset = item.asset || {};
                const isSelected = selectedItemIds.includes(item._id);

                return (
                  <tr 
                    key={item._id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors ${item.isUnexpected ? 'bg-purple-500/5' : ''}`}
                  >
                    {isAuditInProgress && (
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedItemIds([...selectedItemIds, item._id]);
                            else setSelectedItemIds(selectedItemIds.filter(id => id !== item._id));
                          }}
                        />
                      </td>
                    )}
                    <td className="py-3 px-3 font-semibold text-slate-850 dark:text-slate-200">
                      <div className="flex flex-col">
                        <span>{asset.name || 'Unknown Asset'}</span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 px-1 py-0.5 rounded w-max mt-0.5">
                          {asset.assetTag || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{asset.category?.name || 'N/A'}</td>
                    <td className="py-3 px-3">{asset.department?.code || 'N/A'}</td>
                    <td className="py-3 px-3">{asset.location || 'N/A'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        item.verificationStatus === 'MISSING' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        item.verificationStatus === 'DAMAGED' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        item.verificationStatus === 'PENDING' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {item.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.discrepancyType !== 'NONE' ? (
                        <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          {item.discrepancyType.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isAuditInProgress && isAuditor && (
                        <button
                          onClick={() => handleVerifyClick(item)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Audit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner simulation modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScannerOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ScanLine className="h-5 w-5 text-indigo-500 animate-pulse" />
                  Simulate QR / Barcode Scanner
                </span>
                <button onClick={() => setIsScannerOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* simulated camera viewfinder */}
              <div className="h-40 bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border-2 border-slate-800">
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 animate-bounce" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block z-10">Simulated Viewfinder</span>
                <p className="text-[9px] text-slate-650 max-w-[200px] text-center mt-1 z-10 leading-normal">
                  Input a valid asset tag (e.g. AST-LP-001) or serial code to simulate scanner capture.
                </p>
              </div>

              <form onSubmit={handleScannerSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Scan Input (Tag or Barcode)</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. AST-LP-001"
                    value={scannedTagInput}
                    onChange={(e) => setScannedTagInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                {scannerFeedback && (
                  <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-1.5 ${
                    scannerFeedback.type === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 text-emerald-600' :
                    scannerFeedback.type === 'WARN' ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 text-amber-600' :
                    'bg-rose-50 dark:bg-rose-950/10 border-rose-200 text-rose-600'
                  }`}>
                    {scannerFeedback.type === 'SUCCESS' ? <CheckSquare className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                    <span>{scannerFeedback.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Simulate Scan Trigger
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manual verification notes drawer */}
      <AnimatePresence>
        {activeVerifyItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVerifyItem(null)}
              className="fixed inset-0 bg-slate-950 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl p-6 overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 bg-slate-50 dark:bg-slate-950 p-4 -mx-6 -mt-6">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  <ClipboardList className="h-4.5 w-4.5 text-indigo-500" />
                  Audit: {activeVerifyItem.asset?.name}
                </span>
                <button onClick={() => setActiveVerifyItem(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Verification Outcome</label>
                  <select
                    value={verificationStatusSelect}
                    onChange={(e: any) => setVerificationStatusSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="VERIFIED">Verified (Present and correct)</option>
                    <option value="MISSING">Missing (Not located)</option>
                    <option value="DAMAGED">Damaged (Requires maintenance)</option>
                    <option value="DISPOSED">Disposed (Decommissioned)</option>
                    <option value="DUPLICATE">Duplicate (Duplicate tag record)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Auditor verification notes</label>
                  <textarea
                    rows={4}
                    placeholder="Input detailed observations on physical condition, location discrepancies, or holder verification details..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs focus:outline-none h-28 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyMutation.isPending}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  {verifyMutation.isPending && (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Save Audit Log
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
