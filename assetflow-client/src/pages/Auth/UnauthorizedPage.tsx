import { Link } from 'react-router-dom';

import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 select-none">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center glass p-8 rounded-2xl shadow-2xl relative border border-slate-800"
      >
        <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-lg">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">403 Unauthorized</h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Access Denied. You do not have permissions to view this resource. 
          Please contact your administrator if you believe this is an error.
        </p>
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-102 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
