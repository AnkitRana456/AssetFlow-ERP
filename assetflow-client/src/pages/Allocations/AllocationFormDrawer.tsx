import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Save, FileUp, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useCreateAllocation } from '../../hooks/allocationHooks';
import { useAssets } from '../../hooks/assetHooks';
import { useEmployees, useDepartments } from '../../hooks/orgHooks';
import { allocationService } from '../../services/allocationService';

const allocationSchema = z.object({
  asset: z.string().min(1, 'Please select an asset'),
  employee: z.string().min(1, 'Please select an employee'),
  department: z.string().min(1, 'Please select a department'),
  expectedReturn: z.string().optional(),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters').trim(),
  notes: z.string().optional()
});

type AllocationFormValues = z.infer<typeof allocationSchema>;

interface AllocationFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTransfer: (asset: { _id: string; name: string; assetTag: string }) => void;
}

export function AllocationFormDrawer({ isOpen, onClose, onOpenTransfer }: AllocationFormDrawerProps) {
  const createMutation = useCreateAllocation();
  
  // Load database lists
  const { data: assetsData } = useAssets({ limit: 200 }); // List all assets to check double allocations
  const { data: employeesData } = useEmployees({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });

  // States
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [activeAllocation, setActiveAllocation] = useState<any | null>(null);
  const [loadingActiveAlloc, setLoadingActiveAlloc] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      purpose: '',
      notes: ''
    }
  });

  const watchedAsset = watch('asset');
  const watchedEmployee = watch('employee');

  // Sync selected asset details
  useEffect(() => {
    if (watchedAsset) {
      setSelectedAssetId(watchedAsset);
      const foundAsset = assetsData?.data?.find((a: any) => a._id === watchedAsset);
      setSelectedAsset(foundAsset || null);
    } else {
      setSelectedAssetId('');
      setSelectedAsset(null);
      setActiveAllocation(null);
    }
  }, [watchedAsset, assetsData]);

  // If asset is already allocated, fetch its active allocation details
  useEffect(() => {
    if (selectedAsset && selectedAsset.status !== 'AVAILABLE') {
      setLoadingActiveAlloc(true);
      allocationService.getAllocations({ search: selectedAsset.assetTag, status: 'ACTIVE', limit: 1 })
        .then(res => {
          if (res?.data?.length > 0) {
            setActiveAllocation(res.data[0]);
          } else {
            setActiveAllocation(null);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingActiveAlloc(false));
    } else {
      setActiveAllocation(null);
    }
  }, [selectedAsset]);

  // Auto-populate department when employee is selected
  useEffect(() => {
    if (watchedEmployee) {
      const emp = employeesData?.data?.find((e: any) => e._id === watchedEmployee);
      if (emp && emp.department) {
        setValue('department', emp.department._id || emp.department);
      }
    }
  }, [watchedEmployee, employeesData, setValue]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newAttachments = files.map(f => ({
      name: f.name,
      url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80' // Mock receipt URL
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const onSubmit = (values: AllocationFormValues) => {
    if (selectedAsset && selectedAsset.status !== 'AVAILABLE') {
      return; // Block submission of already allocated asset
    }

    createMutation.mutate({
      ...values,
      attachments
    }, {
      onSuccess: () => {
        reset();
        setAttachments([]);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex pl-10 sm:pl-16">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Slide-over Form Container */}
      <div className="relative w-screen max-w-md transform bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Allocate Asset</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="h-[calc(100vh-140px)] flex flex-col justify-between overflow-y-auto p-6 space-y-6">
          <div className="space-y-6">
            
            {/* Asset Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Select Asset *
              </label>
              <select
                {...register('asset')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              >
                <option value="" className="dark:bg-slate-900">-- Choose physical asset --</option>
                {assetsData?.data?.map((a: any) => (
                  <option key={a._id} value={a._id} className="dark:bg-slate-900">
                    {a.name} ({a.assetTag}) - Status: {a.status}
                  </option>
                ))}
              </select>
              {errors.asset && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.asset.message}</p>
              )}
            </div>

            {/* Double Allocation Alert Box */}
            {selectedAsset && selectedAsset.status !== 'AVAILABLE' && (
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 space-y-4 animate-in fade-in slide-in-from-top duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Double Allocation Blocked</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
                      This asset is currently assigned to{' '}
                      <strong className="text-slate-900 dark:text-slate-200">
                        {activeAllocation?.employee 
                          ? `${activeAllocation.employee.firstName} ${activeAllocation.employee.lastName}`
                          : 'another user'}
                      </strong>.
                    </p>
                  </div>
                </div>

                {activeAllocation && (
                  <div className="text-[11px] text-amber-850 dark:text-amber-500 bg-amber-100/50 dark:bg-amber-950/40 p-3 rounded-xl space-y-1">
                    <p>📅 <strong>Expected Return:</strong> {activeAllocation.expectedReturn ? new Date(activeAllocation.expectedReturn).toLocaleDateString() : 'N/A'}</p>
                    <p>🏢 <strong>Department:</strong> {activeAllocation.department?.name || 'N/A'}</p>
                    <p>📝 <strong>Purpose:</strong> {activeAllocation.purpose || 'N/A'}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenTransfer({
                      _id: selectedAsset._id,
                      name: selectedAsset.name,
                      assetTag: selectedAsset.assetTag
                    });
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-xs font-bold transition-all"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Create Transfer Request Instead
                </button>
              </div>
            )}

            {/* Employee Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Assign To Employee *
              </label>
              <select
                {...register('employee')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              >
                <option value="" className="dark:bg-slate-900">-- Choose employee --</option>
                {employeesData?.data?.map((e: any) => (
                  <option key={e._id} value={e._id} className="dark:bg-slate-900">
                    {e.firstName} {e.lastName} ({e.employeeId})
                  </option>
                ))}
              </select>
              {errors.employee && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.employee.message}</p>
              )}
            </div>

            {/* Department Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Department *
              </label>
              <select
                {...register('department')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              >
                <option value="" className="dark:bg-slate-900">-- Choose department --</option>
                {departmentsData?.data?.map((d: any) => (
                  <option key={d._id} value={d._id} className="dark:bg-slate-900">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.department.message}</p>
              )}
            </div>

            {/* Expected Return Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Expected Return Date
              </label>
              <input
                type="date"
                {...register('expectedReturn')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              {errors.expectedReturn && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.expectedReturn.message}</p>
              )}
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Purpose *
              </label>
              <input
                type="text"
                placeholder="e.g. Remote Development Setup"
                {...register('purpose')}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              {errors.purpose && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.purpose.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Optional allocation notes..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                Attachments (Receipts / Inspection docs)
              </label>
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-350 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-400">
                <FileUp className="h-4.5 w-4.5" />
                <span>Upload Documents</span>
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
              {attachments.length > 0 && (
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  {attachments.map((file, idx) => (
                    <p key={idx} className="truncate">📎 {file.name}</p>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || (selectedAsset && selectedAsset.status !== 'AVAILABLE')}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-150 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold text-sm shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <Save className="h-4.5 w-4.5" />
                  Save Allocation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
