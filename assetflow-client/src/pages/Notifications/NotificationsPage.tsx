import { useState } from 'react';

import { 
  useNotifications, 
  useMarkNotificationsRead, 
  useDeleteNotification, 
  useDeleteAllNotifications 
} from '../../hooks/enterpriseHooks';
import { 
  Bell, CheckCheck, Trash2, ChevronLeft, ChevronRight,
  Info, AlertTriangle, CheckCircle2, AlertCircle, CalendarDays, RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useNotifications({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 15
  });

  const markReadMutation = useMarkNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  const handleMarkAllRead = () => {
    markReadMutation.mutate(undefined, {
      onSuccess: () => refetch()
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      deleteAllMutation.mutate(undefined, {
        onSuccess: () => refetch()
      });
    }
  };

  const handleMarkReadSingle = (id: string) => {
    markReadMutation.mutate([id], {
      onSuccess: () => refetch()
    });
  };

  const handleDeleteSingle = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => refetch()
    });
  };

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };
  const unreadCount = data?.unreadCount || 0;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-purple-500 animate-swing" />
            Alert Inbox & Notices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            You have <strong className="text-purple-600 dark:text-purple-400">{unreadCount} unread</strong> notification flags.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markReadMutation.isPending}
            className="flex items-center gap-1 px-3.5 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0 || deleteAllMutation.isPending}
            className="flex items-center gap-1 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Clear Inbox
          </button>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl max-w-sm transition-colors duration-300">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'all' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setStatusFilter('unread'); setPage(1); }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'unread' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => { setStatusFilter('read'); setPage(1); }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'read' 
              ? 'bg-purple-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 p-12 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin text-purple-500" />
            <span className="text-xs text-slate-455">Loading notifications...</span>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="space-y-3">
              {notifications.map((notif: any) => (
                <div
                  key={notif._id}
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl flex items-start justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${
                    !notif.read ? 'border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750">
                      {getAlertIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{notif.title}</h3>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-655 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                      
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-455 font-semibold">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                        
                        {notif.link && (
                          <Link 
                            to={notif.link}
                            className="text-purple-600 hover:text-purple-755 dark:text-purple-400 dark:hover:text-purple-305 transition-colors uppercase tracking-wider font-bold"
                          >
                            Investigate Entity
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkReadSingle(notif._id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-455 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Mark as Read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSingle(notif._id)}
                      className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between transition-colors duration-300">
                <span className="text-xs text-slate-500">Page {page} of {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronLeft className="h-4.5 w-4.5 text-slate-550" />
                  </button>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronRight className="h-4.5 w-4.5 text-slate-550" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-16 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            Inbox is completely empty. Clear skies!
          </div>
        )}
      </div>
    </div>
  );
}
