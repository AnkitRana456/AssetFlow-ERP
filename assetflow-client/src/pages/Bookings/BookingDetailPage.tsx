import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useBookingDetail, 
  useBookingHistory, 
  useCancelBooking, 
  useRescheduleBooking 
} from '../../hooks/bookingHooks';
import { 
  Calendar, Clock, User, MapPin, Tag, AlertTriangle, 
  ChevronLeft, RefreshCw, Trash2, Users, Paperclip, Activity, 
  ArrowRightCircle, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';


export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const { data: booking, isLoading, refetch: refetchDetail } = useBookingDetail(id || '');
  const { data: historyLogs, refetch: refetchHistory } = useBookingHistory(id);

  const cancelMutation = useCancelBooking();
  const rescheduleMutation = useRescheduleBooking();

  // Dialog Trigger States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelSeries, setCancelSeries] = useState(false);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [rescheduleSeries, setRescheduleSeries] = useState(false);
  const [rescheduleConflict, setRescheduleConflict] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Loading booking metrics...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">Booking Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The booking file you are looking for might have been deleted, cancelled, or is invalid.
        </p>
        <button
          onClick={() => navigate('/bookings')}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl cursor-pointer"
        >
          Return to Calendar
        </button>
      </div>
    );
  }

  // Handle Cancel Booking Submission
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason) return;

    cancelMutation.mutate({
      id: booking._id,
      data: { cancellationReason, cancelSeries }
    }, {
      onSuccess: () => {
        setIsCancelModalOpen(false);
        setCancellationReason('');
        refetchDetail();
        refetchHistory();
      },
      onError: (err: any) => {
        alert(err.response?.data?.message || 'Failed to cancel booking');
      }
    });
  };

  // Handle Reschedule Submission
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduleConflict(null);

    const startIso = new Date(`${rescheduleDate}T${rescheduleStart}:00`).toISOString();
    const endIso = new Date(`${rescheduleDate}T${rescheduleEnd}:00`).toISOString();

    rescheduleMutation.mutate({
      bookingId: booking._id,
      startTime: startIso,
      endTime: endIso,
      rescheduleSeries
    }, {
      onSuccess: () => {
        setIsRescheduleOpen(false);
        refetchDetail();
        refetchHistory();
      },
      onError: (err: any) => {
        const errData = err.response?.data;
        if (errData && errData.conflictingBooking) {
          setRescheduleConflict(errData);
        } else {
          alert(errData?.message || 'Failed to reschedule booking');
        }
      }
    });
  };

  // Pre-fill reschedule form fields
  const openReschedule = () => {
    const sDate = new Date(booking.startTime);
    const eDate = new Date(booking.endTime);
    setRescheduleDate(sDate.toISOString().split('T')[0]);
    setRescheduleStart(`${sDate.getHours().toString().padStart(2, '0')}:${sDate.getMinutes().toString().padStart(2, '0')}`);
    setRescheduleEnd(`${eDate.getHours().toString().padStart(2, '0')}:${eDate.getMinutes().toString().padStart(2, '0')}`);
    setIsRescheduleOpen(true);
    setRescheduleConflict(null);
  };

  // Access check
  const canModify = currentUser?.role === 'ADMIN' || currentUser?.role === 'ASSET_MANAGER' || booking.bookedBy?._id === currentUser?.userId;

  // Determine styles depending on Priority / Status
  const getPriorityColor = (p: string) => {
    if (p === 'HIGH') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (p === 'MEDIUM') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'UPCOMING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ONGOING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
          Back to Bookings Workspace
        </button>

        {canModify && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
          <div className="flex gap-2">
            <button
              onClick={openReschedule}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reschedule
            </button>
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Cancel Booking
            </button>
          </div>
        )}
      </div>

      {/* Main Grid detail sheets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Hero Banner Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] h-[150px] w-[150px] rounded-full bg-indigo-500/5 blur-[50px] pointer-events-none" />
            
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getPriorityColor(booking.priority)}`}>
                {booking.priority} Priority
              </span>
              {booking.isRecurring && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  Recurring: {booking.recurrencePattern}
                </span>
              )}
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {booking.title}
            </h2>

            {/* Time interval bar */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Start Event</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">{new Date(booking.startTime).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="hidden sm:block text-slate-300 dark:text-slate-800">
                <ArrowRightCircle className="h-5 w-5" />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">End Event</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-355">{new Date(booking.endTime).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Remarks content */}
            {booking.remarks && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Booking Remarks / Purpose</span>
                <p className="text-xs text-slate-650 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl leading-relaxed">
                  {booking.remarks}
                </p>
              </div>
            )}

            {/* Attachment */}
            {booking.attachment && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Reference Attachment</span>
                <a
                  href={booking.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  <Paperclip className="h-4 w-4 text-blue-500" />
                  View Shared Presentation Document
                </a>
              </div>
            )}

            {/* Cancellation reason if cancelled */}
            {booking.status === 'CANCELLED' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/35 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Cancellation Log Details
                </span>
                <p className="text-xs text-rose-700 dark:text-rose-350">
                  <strong>Reason:</strong> {booking.cancellationReason || 'No reason provided.'}
                </p>
                <p className="text-[10px] text-rose-500 mt-1">
                  Cancelled By: {booking.cancelledBy?.firstName} {booking.cancelledBy?.lastName} on {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Booked Resource Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-indigo-500" />
              Booked Resource Information
            </h3>

            <div className="flex flex-col sm:flex-row gap-5 items-start bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl w-full">
              {booking.resource?.photo ? (
                <img
                  src={booking.resource.photo}
                  alt={booking.resource.name}
                  className="h-20 w-28 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="h-20 w-28 rounded-xl bg-slate-200 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <MapPin className="h-8 w-8" />
                </div>
              )}

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{booking.resource?.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-150 dark:bg-slate-800 px-2 py-0.5 rounded uppercase shrink-0">
                    {booking.resource?.assetTag}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  {booking.resource?.description || 'No description cataloged for this bookable resource.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-550 dark:text-slate-450 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-450" />
                    <strong>Location:</strong> {booking.resource?.location || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-slate-450" />
                    <strong>Status:</strong> {booking.resource?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invited Participants Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-indigo-500" />
              Invited Participants ({booking.participants?.length || 0})
            </h3>

            {(!booking.participants || booking.participants.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No other employees invited to this event.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {booking.participants.map((participant: any) => (
                  <div key={participant._id} className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3 rounded-2xl flex items-center gap-3">
                    <div className="h-8.5 w-8.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold text-xs">
                      {participant.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{participant.firstName} {participant.lastName}</p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-450 truncate">{participant.email || 'No email'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booked By & Activity Logs */}
        <div className="space-y-6">
          {/* Creator Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-indigo-500" />
              Booked By / Organizer
            </h3>

            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl">
              <div className="h-11 w-11 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold text-sm">
                {booking.bookedBy?.firstName ? booking.bookedBy.firstName[0] : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-250">
                  {booking.bookedBy?.firstName} {booking.bookedBy?.lastName}
                </p>
                <span className="text-[10px] font-semibold text-slate-400 block tracking-wide uppercase">
                  {booking.bookedBy?.employeeId}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  {booking.department?.name || 'Staff Department'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Log / History timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              Activity Log / Audit Trail
            </h3>

            <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800 space-y-6 py-2.5">
              {historyLogs && historyLogs.map((log: any) => (
                <div key={log._id} className="relative space-y-1">
                  {/* Circle dot on line */}
                  <span className="absolute -left-[20.5px] top-1 h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900" />
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-slate-600 dark:text-slate-350">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Job'}
                    </span>
                    <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {log.action.replace('BOOKING_', ' ')}
                  </p>
                  
                  <span className="text-[9px] text-slate-550 dark:text-slate-500 block leading-tight">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              
              {(!historyLogs || historyLogs.length === 0) && (
                <p className="text-xs text-slate-450 italic pl-2">No activity audits logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal (Dialog Capture) */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCancelModalOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 space-y-4"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Cancel Booking Request</h3>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Reason for Cancellation</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify the reason (e.g. Meeting rescheduled, resource no longer required)..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                  />
                </div>

                {booking.isRecurring && (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Cancel Future Recurrences?</span>
                      <p className="text-[9px] text-slate-450">Also cancel all upcoming instances of this series.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={cancelSeries}
                        onChange={(e) => setCancelSeries(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                    </label>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={cancelMutation.isPending}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {cancelMutation.isPending && (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {isRescheduleOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRescheduleOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-50 space-y-4"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Reschedule Booking</h3>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Start Time</label>
                    <input
                      type="time"
                      required
                      value={rescheduleStart}
                      onChange={(e) => setRescheduleStart(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">End Time</label>
                    <input
                      type="time"
                      required
                      value={rescheduleEnd}
                      onChange={(e) => setRescheduleEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {booking.isRecurring && (
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Reschedule Series?</span>
                      <p className="text-[9px] text-slate-450">Applies time offsets to all recurring instances.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={rescheduleSeries}
                        onChange={(e) => setRescheduleSeries(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                )}

                {/* Overlap suggested slots inside reschedule modal */}
                {rescheduleConflict && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-[11px] text-rose-800 dark:text-rose-450 block">Overlap Conflict</span>
                        <p className="text-[10px] text-rose-600 dark:text-rose-550 leading-snug">
                          The resource is busy during that block. Select a suggestion below:
                        </p>
                      </div>
                    </div>

                    {rescheduleConflict.suggestedSlots && rescheduleConflict.suggestedSlots.length > 0 && (
                      <div className="space-y-1">
                        {rescheduleConflict.suggestedSlots.slice(0, 3).map((slot: any, sIdx: number) => {
                          const st = new Date(slot.startTime);
                          const et = new Date(slot.endTime);
                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => {
                                setRescheduleDate(st.toISOString().split('T')[0]);
                                setRescheduleStart(`${st.getHours().toString().padStart(2, '0')}:${st.getMinutes().toString().padStart(2, '0')}`);
                                setRescheduleEnd(`${et.getHours().toString().padStart(2, '0')}:${et.getMinutes().toString().padStart(2, '0')}`);
                                setRescheduleConflict(null);
                              }}
                              className="w-full text-left px-2 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 rounded-lg text-[10px] text-slate-700 hover:bg-rose-50 cursor-pointer flex items-center justify-between"
                            >
                              <span>
                                {st.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {et.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <RefreshCw className="h-3 w-3 text-rose-500" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRescheduleOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {rescheduleMutation.isPending && (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Apply Reschedule
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
