import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  User, Lock, Bell, Activity, 
  Check, RefreshCw, UserCheck 
} from 'lucide-react';


export function ProfilePage() {
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Pref states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully.');
    }, 1000);
  };

  const handlePrefsSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Notification preferences updated successfully.');
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-500" />
          My User Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage credentials, avatar identifiers, and notification settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile details column */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center transition-colors duration-300">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl border-2 border-white dark:border-slate-800 mx-auto mb-4">
              {user.firstName[0]}
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{user.firstName} {user.lastName}</h2>
            <span className="text-xs font-semibold text-slate-400 block mt-0.5">{user.email}</span>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-left text-xs text-slate-655 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-455">Employee ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-250">{user.employeeId || 'EMP-0001'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-455">Organization Role</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-455">Account Status</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold text-[10px]">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Activity Logs card list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors duration-300">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-slate-455" />
              Recent Actions log
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-505 mt-1.5 animate-pulse" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">User Login Success</span>
                  <span className="text-[10px] text-slate-455">Today, 4:05 PM</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-305 mt-1.5" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">Audit Scoped Verified</span>
                  <span className="text-[10px] text-slate-455">Yesterday, 10:14 AM</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-305 mt-1.5" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">Password Changed</span>
                  <span className="text-[10px] text-slate-455">June 28, 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configurations column */}
        <div className="md:col-span-2 space-y-6">
          {/* Change password */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 transition-colors duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="h-4.5 w-4.5 text-blue-500" />
              Change Login Password
            </h3>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg outline-none text-sm text-slate-700 dark:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 transition-colors duration-300">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Bell className="h-4.5 w-4.5 text-purple-500" />
              Alert Delivery Preferences
            </h3>

            <form onSubmit={handlePrefsSave} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Email Alerts</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">Receive immediate notifications for asset assignments, maintenance updates, and return reminders.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inAppAlerts}
                    onChange={(e) => setInAppAlerts(e.target.checked)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">In-App Notifications</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">Show notifications inside the navbar bell popover while logged in.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Weekly Digest Ledger</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">Send a weekly PDF email digest summarizing pending approvals and active audit campaigns.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
