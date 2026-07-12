import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, CheckCircle, Camera } from 'lucide-react';
import { useCreateReturn } from '../../hooks/allocationHooks';

const returnSchema = z.object({
  condition: z.enum(['EXCELLENT', 'GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST']),
  returnNotes: z.string().min(5, 'Please provide notes on the asset condition (min 5 chars)').trim()
});

type ReturnFormValues = z.infer<typeof returnSchema>;

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    _id: string;
    name: string;
    assetTag: string;
  } | null;
}

export function ReturnRequestModal({ isOpen, onClose, asset }: ReturnRequestModalProps) {
  const createReturnMutation = useCreateReturn();
  const [photos, setPhotos] = useState<Array<{ name: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      condition: 'GOOD'
    }
  });

  if (!isOpen || !asset) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    // Simulate Cloudinary upload delay
    setTimeout(() => {
      const files = Array.from(e.target.files || []);
      const newPhotos = files.map(file => ({
        name: file.name,
        // Using object URLs for display, in a real system we would upload to Cloudinary and get URLs
        url: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
      setUploading(false);
    }, 1000);
  };

  const onSubmit = (values: ReturnFormValues) => {
    // Send return request with condition, notes, and photos
    createReturnMutation.mutate({
      asset: asset._id,
      condition: values.condition,
      returnNotes: values.returnNotes,
      // Provide fallback demo photos if none selected, or pass selected files
      photos: photos.length > 0 ? photos.map(p => ({ name: p.name, url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80' })) : []
    }, {
      onSuccess: () => {
        reset();
        setPhotos([]);
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
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Submit Return Request</h2>
            <p className="text-xs text-slate-500 mt-1">
              File return workflow for <strong className="text-blue-600 dark:text-blue-400">{asset.name} ({asset.assetTag})</strong>
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
          
          {/* Condition Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Current Condition *
            </label>
            <select
              {...register('condition')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            >
              <option value="EXCELLENT" className="dark:bg-slate-900">Excellent (As allocated)</option>
              <option value="GOOD" className="dark:bg-slate-900">Good (Normal wear & tear)</option>
              <option value="MINOR_DAMAGE" className="dark:bg-slate-900">Minor Damage (Scratches/Dents)</option>
              <option value="MAJOR_DAMAGE" className="dark:bg-slate-900">Major Damage (Broken/Non-functional)</option>
              <option value="LOST" className="dark:bg-slate-900">Lost (Unrecoverable)</option>
            </select>
            {errors.condition && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.condition.message}</p>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Return Inspection Notes *
            </label>
            <textarea
              {...register('returnNotes')}
              rows={3}
              placeholder="Describe physical integrity, missing accessories, or reasons for return..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
            />
            {errors.returnNotes && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.returnNotes.message}</p>
            )}
          </div>

          {/* Photos Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Inspection Photos
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer">
                <Camera className="h-4.5 w-4.5" />
                <span>Upload Photos</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
              {uploading && <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-500" />}
            </div>
            
            {/* Uploaded Photos Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg border border-slate-250 dark:border-slate-800 overflow-hidden group">
                    <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== index))}
                      className="absolute top-1 right-1 p-1 bg-slate-950/80 rounded-full text-slate-350 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
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
              disabled={createReturnMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50 shadow-md shadow-emerald-500/10 text-sm font-semibold flex items-center gap-2 transition-all"
            >
              {createReturnMutation.isPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4.5 w-4.5" />
                  Submit Return
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
