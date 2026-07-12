import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Send } from 'lucide-react';
import { useCreateTransfer } from '../../hooks/allocationHooks';
import { useEmployees } from '../../hooks/orgHooks';

const transferSchema = z.object({
  toEmployee: z.string().min(1, 'Please select a destination employee'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long').trim()
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    _id: string;
    name: string;
    assetTag: string;
  } | null;
}

export function TransferRequestModal({ isOpen, onClose, asset }: TransferRequestModalProps) {
  const { data: employeesData } = useEmployees({ limit: 100 });
  const createTransferMutation = useCreateTransfer();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema)
  });

  if (!isOpen || !asset) return null;

  const onSubmit = (values: TransferFormValues) => {
    createTransferMutation.mutate({
      asset: asset._id,
      toEmployee: values.toEmployee,
      reason: values.reason
    }, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Request Asset Transfer</h2>
            <p className="text-xs text-slate-500 mt-1">
              Initiate transfer workflow for <strong className="text-blue-600 dark:text-blue-400">{asset.name} ({asset.assetTag})</strong>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* Destination Employee Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Transfer Asset To *
            </label>
            <select
              {...register('toEmployee')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            >
              <option value="" className="dark:bg-slate-900">-- Select Destination Employee --</option>
              {employeesData?.data?.map((emp: any) => (
                <option key={emp._id} value={emp._id} className="dark:bg-slate-900">
                  {emp.firstName} {emp.lastName} ({emp.employeeId}) - {emp.department?.name || 'No Dept'}
                </option>
              ))}
            </select>
            {errors.toEmployee && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.toEmployee.message}</p>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Reason for Transfer *
            </label>
            <textarea
              {...register('reason')}
              rows={4}
              placeholder="Provide a detailed business justification for this asset reallocation..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
            />
            {errors.reason && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.reason.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTransferMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50 shadow-md shadow-blue-500/10 text-sm font-semibold flex items-center gap-2 transition-all"
            >
              {createTransferMutation.isPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4.5 w-4.5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
