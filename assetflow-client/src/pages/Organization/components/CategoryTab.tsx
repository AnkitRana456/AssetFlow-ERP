import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Laptop, Armchair, 
  Car, Wrench, Server, Smartphone, Loader2, Sparkles, PlusCircle
} from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../hooks/orgHooks';

// Validation Schema
const customFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').trim(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE']),
  required: z.boolean().default(false)
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category Name is required').trim(),
  description: z.string().optional(),
  icon: z.string().default('package'),
  maintenanceInterval: z.number({ invalid_type_error: 'Interval must be a number' }).min(1, 'Interval must be at least 1 day'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  customFields: z.array(customFieldSchema).default([])
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Map icon string to Lucide component
const iconMap: { [key: string]: React.ComponentType<any> } = {
  laptop: Laptop,
  armchair: Armchair,
  car: Car,
  wrench: Wrench,
  server: Server,
  phone: Smartphone
};

export function CategoryTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries & Mutations
  const { data, isLoading, refetch } = useCategories({ search, page, limit: 5 });
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      status: 'ACTIVE',
      icon: 'laptop',
      customFields: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFields'
  });

  const handleOpenCreate = () => {
    reset({ name: '', description: '', icon: 'laptop', maintenanceInterval: 90, status: 'ACTIVE', customFields: [] });
    setEditingId(null);
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    reset({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'laptop',
      maintenanceInterval: cat.maintenanceInterval,
      status: cat.status,
      customFields: cat.customFields || []
    });
    setEditingId(cat._id);
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setErrorMessage(null);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setIsDrawerOpen(false);
      reset();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'An error occurred during submission.');
    }
  };

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter & Create Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by category name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-blue-500/50"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md hover:scale-102 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                <th className="p-4 pl-6">Icon</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Assets Count</th>
                <th className="p-4">Maintenance Schedule</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 animate-pulse">
                    <td className="p-4 pl-6"><div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="p-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4 text-right pr-6"><div className="h-8 w-16 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((cat: any) => {
                  const IconComponent = iconMap[cat.icon] || Laptop;
                  return (
                    <tr key={cat._id} className="border-b border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div>
                          <p>{cat.name}</p>
                          {cat.customFields && cat.customFields.length > 0 && (
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{cat.customFields.length} Custom Fields</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{cat.assetsCount}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">Every {cat.maintenanceInterval} Days</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cat.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cat.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {cat.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 space-x-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(cat._id)}
                          title="Delete Category"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Drawer Form */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto transition-colors duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  {editingId ? 'Modify Category' : 'Create Category'}
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form id="cat-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. IT Equipment"
                    {...register('name')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                  />
                  {errors.name && <span className="text-rose-400 text-xs">{errors.name.message}</span>}
                </div>

                {/* Icon selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Icon Representative</label>
                  <select
                    {...register('icon')}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400"
                  >
                    <option value="laptop">Laptop / Workstation</option>
                    <option value="armchair">Office Furniture / Chair</option>
                    <option value="car">Vehicle / Logistics</option>
                    <option value="wrench">Tool / Repair Kits</option>
                    <option value="server">Servers / Infrastructure</option>
                    <option value="phone">Mobile / Tablet Devices</option>
                  </select>
                </div>

                {/* Maintenance Interval */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Maintenance Interval (Days)</label>
                  <input
                    type="number"
                    placeholder="e.g. 90"
                    {...register('maintenanceInterval', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                  />
                  {errors.maintenanceInterval && <span className="text-rose-400 text-xs">{errors.maintenanceInterval.message}</span>}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status</label>
                  <select
                    {...register('status')}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe category..."
                    {...register('description')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 resize-none"
                  />
                </div>

                {/* Custom Fields Builder Section */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Custom Schema Fields</span>
                    <button
                      type="button"
                      onClick={() => append({ name: '', type: 'STRING', required: false })}
                      className="text-xs text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Attribute
                    </button>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/40 relative">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Attribute Label (e.g. RAM)"
                            {...register(`customFields.${index}.name` as const)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none text-xs text-slate-700 dark:text-slate-300"
                          />
                          <div className="flex items-center justify-between gap-4">
                            <select
                              {...register(`customFields.${index}.type` as const)}
                              className="py-0.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none text-xs text-slate-600 dark:text-slate-400"
                            >
                              <option value="STRING">Text</option>
                              <option value="NUMBER">Number</option>
                              <option value="BOOLEAN">Checkbox</option>
                              <option value="DATE">Date</option>
                            </select>
                            <label className="flex items-center text-[10px] text-slate-500 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                {...register(`customFields.${index}.required` as const)}
                                className="mr-1 h-3.5 w-3.5 border-slate-300 rounded text-blue-600"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No custom fields defined for this category.</p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cat-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create'}
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
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Delete Category?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this asset category? This will fail if assets are currently registered in this category.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
