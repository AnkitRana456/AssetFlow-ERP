import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FolderKanban, Users, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { DepartmentTab } from './components/DepartmentTab';
import { CategoryTab } from './components/CategoryTab';
import { EmployeeTab } from './components/EmployeeTab';

type TabType = 'departments' | 'categories' | 'employees';

export function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('departments');
  const { user } = useAuthStore();

  // Route Guard: Only Admin can access
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'categories', label: 'Asset Categories', icon: FolderKanban },
    { id: 'employees', label: 'Employee Directory', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
            <ShieldCheck className="h-4 w-4" />
            Administration Console
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Organization Setup</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system master-data: manage departments, asset categories, and promote employee credentials.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 transition-colors duration-300">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative cursor-pointer ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-4 w-5" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'departments' && <DepartmentTab />}
            {activeTab === 'categories' && <CategoryTab />}
            {activeTab === 'employees' && <EmployeeTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
