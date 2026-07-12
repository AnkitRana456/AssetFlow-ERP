import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Calendar, Users, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import { useCreateAudit } from '../../hooks/auditHooks';
import { useEmployees, useDepartments } from '../../hooks/orgHooks';
import { orgService } from '../../services/orgService';
import { useQuery } from '@tanstack/react-query';


interface AuditFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditFormDrawer({ isOpen, onClose }: AuditFormDrawerProps) {
  const createMutation = useCreateAudit();

  // Load selection lists
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: employeesData } = useEmployees({ limit: 100 });

  // Load categories list
  const { data: categoriesData } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: () => orgService.getCategories({ limit: 100 })
  });

  // State values
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'FULL_ORG' | 'DEPARTMENT' | 'LOCATION' | 'CATEGORY' | 'RANDOM_SAMPLING'>('FULL_ORG');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [assignedAuditors, setAssignedAuditors] = useState<string[]>([]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]); // Default 7 days from now

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (type === 'DEPARTMENT' && !department) {
      setFormError('Department is required for Departmental Audits');
      return;
    }
    if (type === 'LOCATION' && !location) {
      setFormError('Location is required for Location-based Audits');
      return;
    }
    if (type === 'CATEGORY' && selectedCategories.length === 0) {
      setFormError('At least one Category is required for Category-scoped Audits');
      return;
    }
    if (assignedAuditors.length === 0) {
      setFormError('At least one auditor must be assigned to this campaign');
      return;
    }

    createMutation.mutate({
      title,
      description,
      type,
      department: type === 'DEPARTMENT' ? department : undefined,
      location: type === 'LOCATION' ? location : undefined,
      categories: type === 'CATEGORY' ? selectedCategories : undefined,
      auditors: assignedAuditors,
      priority,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString()
    }, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
      onError: (err: any) => {
        setFormError(err.response?.data?.message || 'Failed to create audit cycle');
      }
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('FULL_ORG');
    setDepartment('');
    setLocation('');
    setSelectedCategories([]);
    setAssignedAuditors([]);
    setPriority('MEDIUM');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    setFormError(null);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Launch Audit Campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-250 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
          
          {formError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Audit Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Audit Campaign Name</label>
            <input
              type="text"
              required
              placeholder="E.g. Q3 Hardware Audit, IT Lab Inventory"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Scope Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Scoping Type</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none"
            >
              <option value="FULL_ORG">Full Organization (All Assets)</option>
              <option value="DEPARTMENT">Department Scoped</option>
              <option value="LOCATION">Location Scoped</option>
              <option value="CATEGORY">Category Scoped</option>
              <option value="RANDOM_SAMPLING">Random Sampling (20% sample)</option>
            </select>
          </div>

          {/* Department scoping selector */}
          {type === 'DEPARTMENT' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Select Scope Department</label>
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none"
              >
                <option value="">Select Department...</option>
                {departmentsData?.data?.map((dept: any) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location scoping input */}
          {type === 'LOCATION' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Scope Location Tag</label>
              <input
                type="text"
                required
                placeholder="E.g. Building A, 3rd Floor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          )}

          {/* Category scoping select */}
          {type === 'CATEGORY' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Select Scope Categories (Multi)</label>
              <select
                multiple
                value={selectedCategories}
                onChange={(e) => {
                  const options = e.target.options;
                  const selected = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) selected.push(options[i].value);
                  }
                  setSelectedCategories(selected);
                }}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none h-24"
              >
                {categoriesData?.data?.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-slate-450 block">Hold Ctrl (CMD) to choose multiple categories.</span>
            </div>
          )}

          {/* Assign Auditors */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Assign Campaign Auditors (Multi-Select)
            </label>
            <select
              multiple
              required
              value={assignedAuditors}
              onChange={(e) => {
                const options = e.target.options;
                const selected = [];
                for (let i = 0; i < options.length; i++) {
                  if (options[i].selected) selected.push(options[i].value);
                }
                setAssignedAuditors(selected);
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none h-28"
            >
              {employeesData?.data?.map((emp: any) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.role.replace('_', ' ')})
                </option>
              ))}
            </select>
            <span className="text-[9px] text-slate-450 block">Assigned auditors will receive email and dashboard verification targets.</span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p as any)}
                  className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                    priority === p
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Campaign Description
            </label>
            <textarea
              rows={3}
              placeholder="Input details on audit scopes, locations to cover, and validation criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none h-16 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Launching campaign...
              </>
            ) : (
              <>
                <CheckCircle className="h-4.5 w-4.5" />
                Initialize Audit Cycle
              </>
            )}
          </button>

        </form>
      </motion.div>
    </>
  );
}
