import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Search, ShieldAlert, Award, Loader2, Sparkles, X, User, 
  Building2, Power, Briefcase, Mail, Phone, Calendar
} from 'lucide-react';
import { useEmployees, useUpdateEmployee, usePromoteEmployee, useUpdateEmployeeStatus, useDepartments } from '../../../hooks/orgHooks';

// Validation Schema for Promotion
const promotionSchema = z.object({
  role: z.enum(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']),
  department: z.string().nullable().optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters').trim()
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

// Validation Schema for Edit Profile
const editEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First Name is required').trim(),
  lastName: z.string().min(1, 'Last Name is required').trim(),
  phone: z.string().optional(),
  department: z.string().nullable().optional()
});

type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;

export function EmployeeTab() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals / Drawers states
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries & Mutations
  const { data, isLoading } = useEmployees({ search, department: deptFilter, role: roleFilter, status: statusFilter, page, limit: 5 });
  const { data: departmentData } = useDepartments({ limit: 100 }); // for selection

  const updateEmployeeMutation = useUpdateEmployee();
  const promoteMutation = usePromoteEmployee();
  const statusMutation = useUpdateEmployeeStatus();

  // Forms
  const editForm = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema)
  });

  const promoteForm = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: { reason: '' }
  });

  const handleOpenEdit = (emp: any) => {
    setSelectedEmployee(emp);
    editForm.reset({
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone || '',
      department: emp.department?._id || ''
    });
    setErrorMessage(null);
    setIsEditOpen(true);
  };

  const handleOpenPromote = (emp: any) => {
    setSelectedEmployee(emp);
    promoteForm.reset({
      role: emp.role,
      department: emp.department?._id || '',
      reason: ''
    });
    setErrorMessage(null);
    setIsPromoteOpen(true);
  };

  const handleOpenDetail = (emp: any) => {
    setSelectedEmployee(emp);
    setIsDetailOpen(true);
  };

  const onEditSubmit = async (values: EditEmployeeFormValues) => {
    setErrorMessage(null);
    try {
      await updateEmployeeMutation.mutateAsync({
        id: selectedEmployee._id,
        data: {
          ...values,
          department: values.department || null
        }
      });
      setIsEditOpen(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Update failed.');
    }
  };

  const onPromoteSubmit = async (values: PromotionFormValues) => {
    setErrorMessage(null);
    try {
      await promoteMutation.mutateAsync({
        id: selectedEmployee._id,
        data: {
          ...values,
          department: values.department || null
        }
      });
      setIsPromoteOpen(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Promotion failed.');
    }
  };

  const toggleStatus = async (emp: any) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await statusMutation.mutateAsync({ id: emp._id, status: nextStatus });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status change failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row items-center gap-3 justify-between shadow-sm transition-colors duration-300">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-blue-500/50"
          />
        </div>

        <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="flex-1 sm:flex-none py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 focus:border-blue-500/50"
          >
            <option value="">All Departments</option>
            {departmentData?.data?.map((d: any) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 sm:flex-none py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 focus:border-blue-500/50"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="ASSET_MANAGER">Asset Manager</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-600 dark:text-slate-400 focus:border-blue-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                <th className="p-4 pl-6">Employee</th>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 animate-pulse">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="p-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="p-4 text-right pr-6"><div className="h-8 w-24 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((emp: any) => (
                  <tr 
                    key={emp._id} 
                    className="border-b border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-500 cursor-pointer" onClick={() => handleOpenDetail(emp)}>
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-xs text-slate-600 dark:text-slate-400">{emp.employeeId}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {emp.department ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {emp.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wide">
                        {emp.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : emp.status === 'SUSPENDED'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          emp.status === 'ACTIVE' ? 'bg-emerald-500' : emp.status === 'SUSPENDED' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      <button
                        onClick={() => toggleStatus(emp)}
                        title={emp.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenPromote(emp)}
                        title="Promote Credentials"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/5 transition-colors cursor-pointer"
                      >
                        <Award className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        title="Edit Department / Info"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                    No employees found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      {isDetailOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative transition-colors duration-300">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-xl flex items-center justify-center border-2 border-indigo-400/20 shadow-md">
                {selectedEmployee.firstName[0]}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{selectedEmployee.firstName} {selectedEmployee.lastName}</h4>
                <span className="text-xs font-semibold text-slate-400">ID: {selectedEmployee.employeeId}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{selectedEmployee.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{selectedEmployee.phone || 'No phone number registered'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>Department: {selectedEmployee.department?.name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-slate-400" />
                <span>System Access: {selectedEmployee.role.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Registered: {new Date(selectedEmployee.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drawer Form */}
      {isEditOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between shadow-2xl border-l border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Edit Employee Profile</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
              </div>

              {errorMessage && (
                <div className="p-3 mb-4 rounded-lg bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form id="edit-emp-form" onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">First Name</label>
                  <input
                    type="text"
                    {...editForm.register('firstName')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    {...editForm.register('lastName')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Phone</label>
                  <input
                    type="text"
                    {...editForm.register('phone')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <select
                    {...editForm.register('department')}
                    className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400"
                  >
                    <option value="">Unassigned</option>
                    {departmentData?.data?.map((d: any) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-emp-form"
                disabled={updateEmployeeMutation.isPending}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center justify-center gap-2"
              >
                {updateEmployeeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Dialog */}
      {isPromoteOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative transition-colors duration-300">
            <button onClick={() => setIsPromoteOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400"><X className="h-5 w-5" /></button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <Award className="h-6 w-6 text-amber-500" />
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Promote Role: {selectedEmployee.firstName}</h4>
            </div>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={promoteForm.handleSubmit(onPromoteSubmit)} className="space-y-4">
              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Target Role</label>
                <select
                  {...promoteForm.register('role')}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-450"
                >
                  <option value="EMPLOYEE">Employee (Standard Access)</option>
                  <option value="DEPARTMENT_HEAD">Department Head (Management)</option>
                  <option value="ASSET_MANAGER">Asset Manager (Procurement / Tickets)</option>
                  <option value="ADMIN">System Administrator (Full access)</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Associated Department (Optional)</label>
                <select
                  {...promoteForm.register('department')}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-450"
                >
                  <option value="">No Change / Current</option>
                  {departmentData?.data?.map((d: any) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Reason for Promotion</label>
                <textarea
                  rows={3}
                  placeholder="Summarize reasons e.g. Assumed Dept Head duties for Q3 campaigns..."
                  {...promoteForm.register('reason')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-200 resize-none"
                />
                {promoteForm.formState.errors.reason && (
                  <span className="text-rose-400 text-xs">{promoteForm.formState.errors.reason.message}</span>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPromoteOpen(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promoteMutation.isPending}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {promoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
