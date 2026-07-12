import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, User, Building2, MapPin, DollarSign, 
  Wrench, CheckCircle, Clock, FileText, Download, QrCode, 
  ShieldAlert, Trash2, Edit2, AlertCircle, Sparkles, HelpCircle, HardDrive
} from 'lucide-react';
import { useAssetDetail, useAssetHistory, useDeleteAsset } from '../../hooks/assetHooks';
import { useAuthStore } from '../../store/useAuthStore';

type SubTabType = 'general' | 'documents' | 'timeline';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SubTabType>('general');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Queries
  const { data: asset, isLoading, error } = useAssetDetail(id || '');
  const { data: timeline, isLoading: isTimelineLoading } = useAssetHistory(id || '');
  const deleteMutation = useDeleteAsset();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading asset profile details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Asset Profile Error</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The requested asset could not be retrieved, or you lack authorization to view it.
        </p>
        <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(asset._id);
      navigate('/assets');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decommission asset.');
    }
  };

  // QR Download Handler
  const handleDownloadQR = () => {
    if (!asset.qrCode) return;
    const link = document.createElement('a');
    link.href = asset.qrCode;
    link.download = `QR-${asset.assetTag}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500/15 text-emerald-500';
      case 'ALLOCATED': return 'bg-blue-500/15 text-blue-500';
      case 'RESERVED': return 'bg-amber-500/15 text-amber-500';
      case 'UNDER_MAINTENANCE': return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400';
      case 'LOST': return 'bg-rose-500/15 text-rose-500 animate-pulse';
      case 'RETIRED': return 'bg-indigo-500/15 text-indigo-400';
      case 'DISPOSED': return 'bg-slate-500/15 text-slate-400';
      default: return 'bg-slate-500/15 text-slate-400';
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'NEW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'EXCELLENT': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'GOOD': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'FAIR': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'POOR': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const isWriter = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  return (
    <div className="space-y-6 select-none">
      {/* Back button */}
      <div>
        <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Assets Directory
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden transition-colors duration-300">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          {/* Large Photo */}
          <div className="h-28 w-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            {asset.photo ? (
              <img src={asset.photo} alt={asset.name} className="h-full w-full object-cover" />
            ) : (
              <HardDrive className="h-10 w-10 text-slate-400" />
            )}
          </div>

          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">{asset.assetTag}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(asset.status)}`}>{asset.status.replace('_', ' ')}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getConditionColor(asset.condition)}`}>{asset.condition}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">{asset.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Serial Number: {asset.serialNumber}</p>
            {asset.description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-lg italic">{asset.description}</p>
            )}
          </div>
        </div>

        {/* QR Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-center md:self-auto">
          {asset.qrCode ? (
            <>
              <img src={asset.qrCode} alt="Asset QR Code" className="h-16 w-16 bg-white p-1 rounded border" />
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Label Scan QR</span>
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center gap-1 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            </>
          ) : (
            <div className="h-16 w-16 bg-slate-200 flex items-center justify-center rounded"><QrCode className="h-8 w-8 text-slate-400" /></div>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
        {[
          { id: 'general', label: 'General & Purchase Info', icon: Calendar },
          { id: 'documents', label: 'Attachments & Documents', icon: FileText },
          { id: 'timeline', label: 'Lifecycle Audit Timeline', icon: Clock }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubTabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer relative ${
                isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="subTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                {/* System Assignment */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Organizational Setup</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Asset Category</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.category?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Department Pool</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.department?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Holder Assignee</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {asset.currentHolder ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-blue-500" />
                            {asset.currentHolder.firstName} {asset.currentHolder.lastName} ({asset.currentHolder.employeeId})
                          </div>
                        ) : (
                          <span className="text-emerald-500 italic">None - Available in Pool</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Current Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {asset.location || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Shared Pool Resource</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.sharedResource ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Bookable Room/Desk</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.bookable ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Procurement */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Procurement & Financials</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Vendor / Supplier</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.vendor || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Acquisition Cost</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {asset.purchasePrice || 0}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Purchase Acquisition Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Warranty Expiration</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {asset.warrantyExpiry ? (
                          <>
                            {new Date(asset.warrantyExpiry).toLocaleDateString()}
                            {new Date(asset.warrantyExpiry) <= new Date() ? (
                              <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold border border-rose-500/20">Expired</span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">Active</span>
                            )}
                          </>
                        ) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document attachments */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Uploaded Certifications & Documents</h3>
                {asset.documents && asset.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {asset.documents.map((doc: any, i: number) => (
                      <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/20">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">{doc.name}</p>
                            <span className="text-[10px] text-slate-500">Attached Resource</span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          title="Open Document Link"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-12 italic text-sm">No manuals, invoices, or certificate documents attached to this asset.</p>
                )}
              </div>
            )}

            {/* Chronological Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">Chronological Lifecycle Events</h3>
                
                {isTimelineLoading ? (
                  <div className="flex justify-center p-6"><Loader className="h-8 w-8 text-blue-500 animate-spin" /></div>
                ) : timeline && timeline.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-slate-250 dark:border-slate-800 ml-4 space-y-6">
                    {timeline.map((event: any, i: number) => (
                      <div key={i} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center" />
                        
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{event.title}</h4>
                            <span className="text-[10px] text-slate-500 font-semibold">{new Date(event.date).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{event.description}</p>
                          <span className="text-[10px] text-slate-400 block font-mono">Performed by: {event.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-12 italic text-sm">No activity logs recorded for this asset.</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decommission control bar */}
      {isWriter && (
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between text-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">Administrative tools: Edit specifications or permanently decommission this asset from inventory.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenEdit(asset)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit specifications
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Decommission
            </button>
          </div>
        </div>
      )}

      {/* Permanent Decommission Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Confirm Decommission?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to decommission this asset? This action will set its status to DELETED and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline loading spinner component
function Loader({ className }: { className?: string }) {
  return <div className={`border-2 border-t-transparent border-blue-500 rounded-full animate-spin ${className}`} />;
}
