import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Laptop, Armchair, 
  Car, Wrench, Server, Smartphone, Loader2, Sparkles, FolderKanban,
  FileDown, FileUp, Filter, ArrowUpDown, Calendar, DollarSign, MapPin, CheckCircle
} from 'lucide-react';
import { 
  useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, useImportAssets 
} from '../../hooks/assetHooks';
import { useCategories, useDepartments } from '../../hooks/orgHooks';
import { useAuthStore } from '../../store/useAuthStore';
import { assetService } from '../../services/assetService';

// Zod Validation Schema for Asset Form
const assetFormSchema = z.object({
  name: z.string().min(1, 'Asset Name is required').trim(),
  serialNumber: z.string().min(3, 'Serial Number must be at least 3 characters').trim().toUpperCase(),
  category: z.string().min(1, 'Category is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required').trim(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('NEW'),
  vendor: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),
  bookable: z.boolean().default(false),
  sharedResource: z.boolean().default(false),
  description: z.string().optional(),
  status: z.string().optional()
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export function AssetDirectoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);

  // States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [condFilter, setCondFilter] = useState('');
  const [sharedFilter, setSharedFilter] = useState('');
  const [sortBy, setSortBy] = useState('assetTag');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<FileList | null>(null);

  // Queries & Mutations
  const { data, isLoading, refetch } = useAssets({
    search, status: statusFilter, department: deptFilter, category: catFilter,
    condition: condFilter, shared: sharedFilter, sortBy, order: sortOrder, page, limit: 8
  });

  const { data: categories } = useCategories({ limit: 100 });
  const { data: departments } = useDepartments({ limit: 100 });

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const importMutation = useImportAssets();

  // React Hook Form
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      condition: 'NEW',
      bookable: false,
      sharedResource: false
    }
  });

  const handleOpenCreate = () => {
    reset({
      name: '', serialNumber: '', category: '', department: '', location: '',
      condition: 'NEW', vendor: '', purchaseDate: '', warrantyExpiry: '',
      purchasePrice: 0, bookable: false, sharedResource: false, description: ''
    });
    setEditingAsset(null);
    setSelectedPhoto(null);
    setSelectedDocs(null);
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (asset: any) => {
    reset({
      name: asset.name,
      serialNumber: asset.serialNumber,
      category: asset.category?._id || '',
      department: asset.department?._id || '',
      location: asset.location || '',
      condition: asset.condition,
      vendor: asset.vendor || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
      purchasePrice: asset.purchasePrice || 0,
      bookable: asset.bookable || false,
      sharedResource: asset.sharedResource || false,
      description: asset.description || '',
      status: asset.status
    });
    setEditingAsset(asset);
    setSelectedPhoto(null);
    setSelectedDocs(null);
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: AssetFormValues) => {
    setErrorMessage(null);
    const formData = new FormData();
    
    // Append standard fields
    Object.entries(values).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    // Append files
    if (selectedPhoto) {
      formData.append('photo', selectedPhoto);
    }
    if (selectedDocs) {
      Array.from(selectedDocs).forEach(doc => {
        formData.append('documents', doc);
      });
    }

    try {
      if (editingAsset) {
        await updateMutation.mutateAsync({ id: editingAsset._id, formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDrawerOpen(false);
      reset();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save asset. Check unique serial constraints.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete asset.');
    }
  };

  // Export CSV Action
  const handleExportCSV = async () => {
    try {
      const blob = await assetService.exportAssets();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AssetFlow-Assets-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('CSV Export failed.');
    }
  };

  // CSV Import Trigger
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportSummary(null);
      try {
        const result = await importMutation.mutateAsync(e.target.files[0]);
        setImportSummary(result);
      } catch (err: any) {
        alert(err.response?.data?.message || 'CSV Import failed. Check schema headers.');
      }
    }
  };

  // Condition Badge Generator
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

  // Status Badge Generator
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

  // Toggle Sorting helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const isWriter = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Asset Management Workspace</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-1">Asset Registry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register new equipment, monitor allocations, download QR labels, and audit lifecycle timelines.
          </p>
        </div>

        {/* Bulk tools */}
        <div className="flex flex-wrap gap-2">
          {isWriter && (
            <>
              <input
                type="file"
                ref={csvImportRef}
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
              <button
                onClick={() => csvImportRef.current?.click()}
                className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <FileUp className="h-4 w-4 text-blue-500" />
                Import CSV
              </button>
            </>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <FileDown className="h-4 w-4 text-indigo-500" />
            Export CSV
          </button>

          {isWriter && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-102 transition-all cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Import summary alert overlay */}
      {importSummary && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start justify-between text-slate-300">
          <div className="flex gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-slate-200">{importSummary.message}</p>
              {importSummary.errors && importSummary.errors.length > 0 && (
                <div className="mt-2 text-xs text-rose-400 space-y-1 max-h-24 overflow-y-auto pr-2">
                  <p className="font-bold">Errors encountered:</p>
                  {importSummary.errors.map((err: string, i: number) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setImportSummary(null)} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* 2. Statistical badging row */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total Assets', val: data.stats.total, color: 'text-slate-400 border-slate-800 bg-slate-900/50' },
            { label: 'Available', val: data.stats.available, color: 'text-emerald-500 border-emerald-500/10 bg-emerald-500/5' },
            { label: 'Allocated', val: data.stats.allocated, color: 'text-blue-500 border-blue-500/10 bg-blue-500/5' },
            { label: 'Maintenance', val: data.stats.maintenance, color: 'text-yellow-500 border-yellow-500/10 bg-yellow-500/5' },
            { label: 'Lost', val: data.stats.lost, color: 'text-rose-500 border-rose-500/10 bg-rose-500/5' },
            { label: 'Retired', val: data.stats.retired, color: 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5' },
            { label: 'Disposed', val: data.stats.disposed, color: 'text-slate-500 border-slate-500/10 bg-slate-500/5' }
          ].map((stat, idx) => (
            <div key={idx} className={`p-3 border rounded-xl flex flex-col justify-between ${stat.color} transition-colors duration-300`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{stat.label}</span>
              <span className="text-lg font-bold mt-1">{stat.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Filter Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row items-center gap-3 justify-between shadow-sm transition-colors duration-300">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tag, name, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-blue-500/50"
          />
        </div>

        <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs text-slate-600 dark:text-slate-400"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
          </select>

          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs text-slate-600 dark:text-slate-400"
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
            className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs text-slate-600 dark:text-slate-400"
          >
            <option value="">All Categories</option>
            {categories?.data?.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Condition */}
          <select
            value={condFilter}
            onChange={(e) => setCondFilter(e.target.value)}
            className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs text-slate-600 dark:text-slate-400"
          >
            <option value="">All Conditions</option>
            <option value="NEW">New</option>
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
          </select>

          {/* Bookable */}
          <select
            value={sharedFilter}
            onChange={(e) => setSharedFilter(e.target.value)}
            className="flex-1 sm:flex-none py-1.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs text-slate-600 dark:text-slate-400"
          >
            <option value="">All Types</option>
            <option value="true">Shared / Bookable</option>
          </select>
        </div>
      </div>

      {/* 4. Table Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                <th className="p-4 pl-6 cursor-pointer" onClick={() => handleSort('assetTag')}>
                  <span className="flex items-center gap-1">Asset Tag <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">Asset Name <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="p-4">Category</th>
                <th className="p-4">Department</th>
                <th className="p-4">Holder</th>
                <th className="p-4">Status</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4"><div className="h-5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4 text-right pr-6"><div className="h-8 w-24 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((asset: any) => (
                  <tr key={asset._id} className="border-b border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <Link to={`/assets/${asset._id}`} className="hover:underline">{asset.assetTag}</Link>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                          {asset.photo ? (
                            <img src={asset.photo} alt={asset.name} className="h-full w-full object-cover" />
                          ) : (
                            <Laptop className="h-4.5 w-4.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">SN: {asset.serialNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{asset.category?.name || 'N/A'}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{asset.department?.name || 'N/A'}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {asset.currentHolder ? (
                        `${asset.currentHolder.firstName} ${asset.currentHolder.lastName}`
                      ) : (
                        <span className="text-slate-400 text-xs italic">Shared / Available</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(asset.status)}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-[10px] font-bold ${getConditionColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {asset.location}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6 space-x-1">
                      <Link 
                        to={`/assets/${asset._id}`}
                        className="p-1.5 inline-block rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        title="View Asset Profile"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Link>
                      {isWriter && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                            title="Edit Asset Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(asset._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer"
                            title="Decommission / Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 italic">
                    No physical assets found matching the parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Showing page {page} of {data.pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === data.pagination.pages}
                onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Draw Form Panel (Register / Edit) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto transition-colors duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  {editingAsset ? `Edit Asset ${editingAsset.assetTag}` : 'Register New Asset'}
                </h3>
                <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
              </div>

              {errorMessage && (
                <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form id="asset-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-slate-350">Asset Name</label>
                    <input
                      type="text"
                      placeholder="e.g. MacBook Pro M3 Max"
                      {...register('name')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-200"
                    />
                    {errors.name && <span className="text-rose-400 text-xs">{errors.name.message}</span>}
                  </div>

                  {/* Serial */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. C02X12345678"
                      disabled={!!editingAsset}
                      {...register('serialNumber')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-200 disabled:opacity-60"
                    />
                    {errors.serialNumber && <span className="text-rose-400 text-xs">{errors.serialNumber.message}</span>}
                  </div>

                  {/* Condition */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Condition</label>
                    <select
                      {...register('condition')}
                      className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400"
                    >
                      <option value="NEW">New</option>
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Category</label>
                    <select
                      {...register('category')}
                      className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400"
                    >
                      <option value="">Select Category...</option>
                      {categories?.data?.map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.category && <span className="text-rose-400 text-xs">{errors.category.message}</span>}
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Department</label>
                    <select
                      {...register('department')}
                      className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400"
                    >
                      <option value="">Select Department...</option>
                      {departments?.data?.map((d: any) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                    {errors.department && <span className="text-rose-400 text-xs">{errors.department.message}</span>}
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-slate-350">Specific Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Building B, Level 4, Desk 42"
                      {...register('location')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-200"
                    />
                    {errors.location && <span className="text-rose-400 text-xs">{errors.location.message}</span>}
                  </div>

                  {/* Vendor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Vendor / Supplier</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple Inc."
                      {...register('vendor')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-200"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Purchase Price ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1999"
                      {...register('purchasePrice', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-200"
                    />
                  </div>

                  {/* Purchase Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Purchase Date</label>
                    <input
                      type="date"
                      {...register('purchaseDate')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-400"
                    />
                  </div>

                  {/* Warranty Expiry */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350">Warranty Expiry</label>
                    <input
                      type="date"
                      {...register('warrantyExpiry')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-400"
                    />
                  </div>
                </div>

                {/* File Uploads */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Photo upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 block">Asset Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                      className="text-xs text-slate-400 w-full"
                    />
                  </div>

                  {/* Documents uploads */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 block">Attachments (Invoices, Warranty, Manuals)</label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx"
                      onChange={(e) => setSelectedDocs(e.target.files)}
                      className="text-xs text-slate-400 w-full"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6 py-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('bookable')}
                      className="mr-2 h-4 w-4 border-slate-800 bg-slate-950 rounded text-blue-600"
                    />
                    Bookable Resource
                  </label>
                  <label className="flex items-center text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('sharedResource')}
                      className="mr-2 h-4 w-4 border-slate-800 bg-slate-950 rounded text-blue-600"
                    />
                    Shared Pool Asset
                  </label>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350">Asset Specifications</label>
                  <textarea
                    rows={2}
                    placeholder="Enter configuration specs, processor, memory size, etc..."
                    {...register('description')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-200 resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="asset-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingAsset ? 'Save' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Decommission Asset?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to mark this asset as deleted/decommissioned? This is soft-delete based.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
