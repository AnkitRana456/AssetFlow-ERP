import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Building2, CheckCircle2, 
  Loader2, Sparkles, User, Power
} from 'lucide-react';

import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useEmployees } from '../../../hooks/orgHooks';

// Validation Schema
const departmentSchema = z.object({
  name: z.string().min(1, 'Department Name is required').trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code max 10 characters').trim().toUpperCase(),
  description: z.string().optional(),
  parentDepartment: z.string().nullable().optional(),
  departmentHead: z.string().nullable().optional(),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function DepartmentTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries & Mutations
  const { data, isLoading } = useDepartments({ search, status: statusFilter, page, limit: 5 });
  const { data: employeeData } = useEmployees({ limit: 100 }); // for Head selection
  const { data: parentDepts } = useDepartments({ limit: 100 }); // for Parent selection

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema) as any,
    defaultValues: { status: 'ACTIVE' }
  });

  const handleOpenCreate = () => {
    reset({ name: '', code: '', description: '', parentDepartment: '', departmentHead: '', location: '', status: 'ACTIVE' });
    setEditingId(null);
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (dept: any) => {
    reset({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      parentDepartment: dept.parentDepartment?._id || '',
      departmentHead: dept.departmentHead?._id || '',
      location: dept.location || '',
      status: dept.status
    });
    setEditingId(dept._id);
    setErrorMessage(null);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    setErrorMessage(null);
    const payload = {
      ...values,
      parentDepartment: values.parentDepartment || null,
      departmentHead: values.departmentHead || null
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
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

  const toggleDeactivate = async (dept: any) => {
    const nextStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateMutation.mutateAsync({
        id: dept._id,
        data: { name: dept.name, code: dept.code, status: nextStatus }
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status toggle failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Departments', value: data.stats.totalDepartments, icon: Building2, color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/20 text-blue-500' },
            { label: 'Active Departments', value: data.stats.activeDepartments, icon: CheckCircle2, color: 'from-emerald-600/20 to-green-600/20 border-emerald-500/20 text-emerald-500' },
            { label: 'Inactive Departments', value: data.stats.inactiveDepartments, icon: X, color: 'from-rose-600/20 to-red-600/20 border-rose-500/20 text-rose-500' },
            { label: 'Employees Assigned', value: data.stats.employeesAssigned, icon: User, color: 'from-amber-600/20 to-yellow-600/20 border-amber-500/20 text-amber-500' }
          ].map((card, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden transition-colors duration-300">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{card.value}</h3>
              </div>
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br border flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Search, Filters, Create Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-blue-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 focus:border-blue-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md hover:scale-102 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* 3. Department Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                <th className="p-4 pl-6">Department Name</th>
                <th className="p-4">Code</th>
                <th className="p-4">Department Head</th>
                <th className="p-4">Parent Department</th>
                <th className="p-4 text-center">Employees</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 animate-pulse">
                    <td className="p-4 pl-6"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-8 mx-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4 text-right pr-6"><div className="h-8 w-20 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((dept: any) => (
                  <tr key={dept._id} className="border-b border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-800 dark:text-slate-200">{dept.name}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">{dept.code}</span></td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {dept.departmentHead ? `${dept.departmentHead.firstName} ${dept.departmentHead.lastName}` : <span className="text-slate-400 text-xs italic">Unassigned</span>}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {dept.parentDepartment ? `${dept.parentDepartment.name} (${dept.parentDepartment.code})` : <span className="text-slate-400 text-xs">None</span>}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-200">{dept.employeesCount}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        dept.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dept.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {dept.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      <button
                        onClick={() => toggleDeactivate(dept)}
                        title={dept.status === 'ACTIVE' ? 'Deactivate Department' : 'Activate Department'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        title="Edit Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(dept._id)}
                        title="Delete Department"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                    No departments found matching the criteria.
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

      {/* 4. Form Drawer (Create / Edit) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  {editingId ? 'Modify Department' : 'Create New Department'}
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

              <form id="dept-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Assurance"
                    {...register('name')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                  />
                  {errors.name && <span className="text-rose-400 text-xs">{errors.name.message}</span>}
                </div>

                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Department Code</label>
                  <input
                    type="text"
                    placeholder="e.g. QA"
                    disabled={!!editingId}
                    {...register('code')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 disabled:opacity-60"
                  />
                  {errors.code && <span className="text-rose-400 text-xs">{errors.code.message}</span>}
                </div>

                {/* Parent */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Parent Department</label>
                  <select
                    {...register('parentDepartment')}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400"
                  >
                    <option value="">None (Top Level)</option>
                    {parentDepts?.data
                      ?.filter((d: any) => d._id !== editingId)
                      .map((d: any) => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                      ))}
                  </select>
                </div>

                {/* Head */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Department Head</label>
                  <select
                    {...register('departmentHead')}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400"
                  >
                    <option value="">Select Employee...</option>
                    {employeeData?.data?.map((emp: any) => (
                      <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Building C, Room 201"
                    {...register('location')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                  />
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
                    placeholder="Describe department function..."
                    {...register('description')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 resize-none"
                  />
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
                form="dept-form"
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

      {/* 5. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Delete Department?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this department? This action is soft-delete based but cannot be undone if there are assets dependencies.
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
