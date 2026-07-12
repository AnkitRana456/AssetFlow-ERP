import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, Plus, Search, Clock, 
  CheckCircle, Sparkles, X, Users, MapPin, Calendar, CalendarRange, 
  ChevronLeft, ChevronRight, Activity, ArrowRight, AlertCircle
} from 'lucide-react';

import { useAuthStore } from '../../store/useAuthStore';
import { useAssets } from '../../hooks/assetHooks';
import { useEmployees, useDepartments } from '../../hooks/orgHooks';
import { 
  useCreateBooking, 
  useBookingCalendar, 
  useRescheduleBooking, 
  useResourceAvailability 
} from '../../hooks/bookingHooks';
import { bookingService } from '../../services/bookingService';
import { io } from 'socket.io-client';

export function BookingCalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const calendarRef = useRef<FullCalendar>(null);

  // States
  const [viewTab, setViewTab] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');


  // Socket Connection for live updates
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('connect', () => {
      console.log('🔌 Connected to live bookings channel');
      socket.emit('join_role', user?.role);
      socket.emit('join_user', user?.userId);
    });

    socket.on('calendar_update', (data: any) => {
      console.log('⚡ Live calendar update received:', data);
      refetchCalendar();
      refetchTimeline();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // React Query Calls
  const { data: calendarEvents, refetch: refetchCalendar } = useBookingCalendar();
  const { data: assetsData } = useAssets({ isBookable: 'true', limit: 100 });
  const { data: employeesData } = useEmployees({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  
  // Custom Timeline Availability Query
  const { data: timelineData, refetch: refetchTimeline } = useResourceAvailability({ date: selectedDate });

  const createBookingMutation = useCreateBooking();
  const rescheduleBookingMutation = useRescheduleBooking();

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formResource, setFormResource] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [formRemarks, setFormRemarks] = useState('');
  const [formParticipants, setFormParticipants] = useState<string[]>([]);
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrencePattern, setFormRecurrencePattern] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [formRecurrenceUntil, setFormRecurrenceUntil] = useState('');
  const [formAttachment, setFormAttachment] = useState('');
  
  // Smart Availability Checker State
  const [availabilityState, setAvailabilityState] = useState<{
    status: 'LOADING' | 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'RESERVED' | 'UNAVAILABLE' | 'IDLE';
    detail?: string;
    suggestions?: Array<{ startTime: string; endTime: string }>;
    conflictingBooking?: any;
  }>({ status: 'IDLE' });

  // Conflict suggestion modal/banner helper
  const [conflictError, setConflictError] = useState<{
    message: string;
    conflictingBooking?: any;
    suggestedSlots?: Array<{ startTime: string; endTime: string }>;
    conflicts?: Array<{ date: string; conflict: any }>;
  } | null>(null);

  // Trigger Availability checks on Form Change
  useEffect(() => {
    if (formResource && formDate && formStartTime && formEndTime) {
      setAvailabilityState({ status: 'LOADING' });
      
      const startIso = new Date(`${formDate}T${formStartTime}:00`).toISOString();
      const endIso = new Date(`${formDate}T${formEndTime}:00`).toISOString();

      bookingService.getResourceAvailability({
        resourceId: formResource,
        date: formDate,
        startTime: startIso,
        endTime: endIso
      })
        .then((res) => {
          if (res.available) {
            setAvailabilityState({ status: 'AVAILABLE' });
          } else {
            setAvailabilityState({
              status: res.status,
              detail: res.detail,
              suggestions: res.suggestions,
              conflictingBooking: res.conflictingBooking
            });
          }
        })
        .catch(() => {
          setAvailabilityState({ status: 'UNAVAILABLE', detail: 'Could not fetch state' });
        });
    } else {
      setAvailabilityState({ status: 'IDLE' });
    }
  }, [formResource, formDate, formStartTime, formEndTime]);

  // Create booking submit
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const startIso = new Date(`${formDate}T${formStartTime}:00`).toISOString();
    const endIso = new Date(`${formDate}T${formEndTime}:00`).toISOString();

    const payload = {
      title: formTitle,
      resource: formResource,
      startTime: startIso,
      endTime: endIso,
      priority: formPriority,
      remarks: formRemarks,
      participants: formParticipants,
      isRecurring: formIsRecurring,
      recurrencePattern: formIsRecurring ? formRecurrencePattern : undefined,
      recurrenceUntil: formIsRecurring && formRecurrenceUntil ? new Date(formRecurrenceUntil).toISOString() : null,
      attachment: formAttachment || undefined
    };

    createBookingMutation.mutate(payload, {
      onSuccess: () => {
        setIsDrawerOpen(false);
        resetForm();
        refetchCalendar();
        refetchTimeline();
      },
      onError: (err: any) => {
        const errorResponse = err.response?.data;
        if (errorResponse && (errorResponse.conflictingBooking || errorResponse.conflicts || errorResponse.suggestedSlots)) {
          setConflictError({
            message: errorResponse.message,
            conflictingBooking: errorResponse.conflictingBooking,
            suggestedSlots: errorResponse.suggestedSlots,
            conflicts: errorResponse.conflicts
          });
        } else {
          alert(errorResponse?.message || 'Failed to register booking');
        }
      }
    });
  };

  // Drag and Drop reschedule handler
  const handleEventDrop = (info: any) => {
    const bookingId = info.event.id;
    const startStr = info.event.start.toISOString();
    const endStr = info.event.end.toISOString();

    rescheduleBookingMutation.mutate({
      bookingId,
      startTime: startStr,
      endTime: endStr
    }, {
      onSuccess: () => {
        refetchCalendar();
        refetchTimeline();
      },
      onError: (err: any) => {
        info.revert();
        const errorResponse = err.response?.data;
        if (errorResponse && errorResponse.conflictingBooking) {
          alert(`Reschedule Conflict! The resource is booked by "${errorResponse.conflictingBooking.title}" during this time.`);
        } else {
          alert(errorResponse?.message || 'Could not reschedule event.');
        }
      }
    });
  };

  const handleEventResize = (info: any) => {
    const bookingId = info.event.id;
    const startStr = info.event.start.toISOString();
    const endStr = info.event.end.toISOString();

    rescheduleBookingMutation.mutate({
      bookingId,
      startTime: startStr,
      endTime: endStr
    }, {
      onSuccess: () => {
        refetchCalendar();
        refetchTimeline();
      },
      onError: (err: any) => {
        info.revert();
        const errorResponse = err.response?.data;
        alert(errorResponse?.message || 'Could not resize booking.');
      }
    });
  };

  const resetForm = () => {
    setFormTitle('');
    setFormResource('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormPriority('MEDIUM');
    setFormRemarks('');
    setFormParticipants([]);
    setFormIsRecurring(false);
    setFormRecurrencePattern('WEEKLY');
    setFormRecurrenceUntil('');
    setFormAttachment('');
    setConflictError(null);
  };

  const handleSelectSuggestedSlot = (slot: { startTime: string; endTime: string }) => {
    const sDate = new Date(slot.startTime);
    const eDate = new Date(slot.endTime);
    
    setFormDate(sDate.toISOString().split('T')[0]);
    setFormStartTime(`${sDate.getHours().toString().padStart(2, '0')}:${sDate.getMinutes().toString().padStart(2, '0')}`);
    setFormEndTime(`${eDate.getHours().toString().padStart(2, '0')}:${eDate.getMinutes().toString().padStart(2, '0')}`);
    setConflictError(null);
  };

  // Open creation pre-populated
  const openCreateDrawer = (resourceId?: string, dateStr?: string, timeStart?: string, timeEnd?: string) => {
    resetForm();
    if (resourceId) setFormResource(resourceId);
    if (dateStr) setFormDate(dateStr);
    if (timeStart) setFormStartTime(timeStart);
    if (timeEnd) setFormEndTime(timeEnd);
    setIsDrawerOpen(true);
  };

  // Filtered Calendar Events for search and drop downs
  const filteredEvents = (calendarEvents || []).filter((event: any) => {
    const props = event.extendedProps;
    if (statusFilter && props.status !== statusFilter) return false;
    if (departmentFilter && props.departmentCode !== departmentFilter) return false;
    
    if (searchQuery) {

      const q = searchQuery.toLowerCase();
      const matchesTitle = event.title?.toLowerCase().includes(q);
      const matchesUser = props.bookedByName?.toLowerCase().includes(q);
      const matchesResource = props.resourceName?.toLowerCase().includes(q);
      return matchesTitle || matchesUser || matchesResource;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] h-[200px] w-[200px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              Shared Assets Command
            </span>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <CalendarRange className="h-7 w-7 text-indigo-400" />
              Enterprise Resource Bookings
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Reserve meeting rooms, projectors, training spaces, or company vehicles. Review instant availabilities and schedule recurring events.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/bookings/analytics')}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Activity className="h-4.5 w-4.5 text-indigo-400" />
              Usage Analytics
            </button>
            <button
              onClick={() => openCreateDrawer()}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="h-4.5 w-4.5" />
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs and Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs switch */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl flex gap-1 self-start">
            <button
              onClick={() => setViewTab('calendar')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewTab === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar Workspace
            </button>
            <button
              onClick={() => setViewTab('timeline')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewTab === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              Resource Timeline Grid
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-250 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departmentsData?.data?.map((d: any) => (
                <option key={d._id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewTab === 'calendar' ? (
          <motion.div
            key="calendar-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto min-w-[700px] lg:min-w-0"
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={4}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
              }}
              themeSystem="standard"
              events={filteredEvents}
              eventClick={(info) => navigate(`/bookings/${info.event.id}`)}
              select={(info) => {
                const sDate = info.startStr.split('T')[0];
                let sTime = '09:00';
                let eTime = '10:00';
                if (info.startStr.includes('T')) {
                  const sParts = info.startStr.split('T')[1].split(':');
                  sTime = `${sParts[0]}:${sParts[1]}`;
                  const eParts = info.endStr.split('T')[1].split(':');
                  eTime = `${eParts[0]}:${eParts[1]}`;
                }
                openCreateDrawer(undefined, sDate, sTime, eTime);
              }}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="timeline-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
          >
            {/* Timeline date navigation */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Availability Grid: {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(prev.toISOString().split('T')[0]);
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-850 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1 hover:bg-white dark:hover:bg-slate-850 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(next.toISOString().split('T')[0]);
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-850 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Custom Grid Scheduler */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px] border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
                {/* Header columns (8am to 8pm) */}
                <div className="flex bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">
                  <div className="w-1/4 min-w-[200px] px-4 flex items-center">Bookable Asset</div>
                  <div className="w-3/4 grid grid-cols-12 text-center divide-x divide-slate-200 dark:divide-slate-800">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div key={idx} className="px-1">
                        {(idx + 8).toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows data */}
                {(!timelineData || timelineData.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No bookable assets configured. Head to the assets list to mark resources as bookable.
                  </div>
                ) : (
                  timelineData.map((row: any) => (
                    <div key={row.resourceId} className="flex hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors py-2.5">
                      {/* Asset name cell */}
                      <div className="w-1/4 min-w-[200px] px-4 flex flex-col justify-center">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{row.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded uppercase">
                            {row.assetTag}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {row.location || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Time grid blocks */}
                      <div className="w-3/4 grid grid-cols-12 gap-1.5 px-3">
                        {row.timeline.map((block: any, idx: number) => {
                          const hour = idx + 8;
                          const blockStartTime = `${hour.toString().padStart(2, '0')}:00`;
                          const blockEndTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

                          // Render conditional colors
                          let bgStyle = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer';
                          let labelText = 'Available';

                          if (block.status === 'BUSY') {
                            bgStyle = 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40';
                            labelText = block.title || 'Busy';
                          } else if (block.status === 'RESERVED') {
                            bgStyle = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40';
                            labelText = block.title || 'Reserved';
                          } else if (block.status === 'MAINTENANCE') {
                            bgStyle = 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed';
                            labelText = 'Maintenance';
                          } else if (block.status === 'UNAVAILABLE') {
                            bgStyle = 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed';
                            labelText = 'Unavailable';
                          }

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (block.status === 'AVAILABLE') {
                                  openCreateDrawer(row.resourceId, selectedDate, blockStartTime, blockEndTime);
                                } else if (block.bookingId) {
                                  navigate(`/bookings/${block.bookingId}`);
                                }
                              }}
                              className={`border rounded-lg p-1 text-[9px] font-medium flex flex-col justify-between h-12 transition-all relative overflow-hidden ${bgStyle}`}
                            >
                              <span className="opacity-60 leading-none">{blockStartTime}</span>
                              <span className="font-bold truncate leading-snug">{labelText}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Form Slide-over Drawer (AnimatePresence) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40"
            />

            {/* Slide Drawer */}
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
                  <CalendarDays className="h-5 w-5 text-indigo-500" />
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Register Shared Booking</h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleCreateBooking} className="flex-1 p-6 space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Booking Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Weekly Sync, Client Presentation"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Resource Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Select Resource</label>
                  <select
                    required
                    value={formResource}
                    onChange={(e) => setFormResource(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a bookable resource...</option>
                    {assetsData?.data?.map((asset: any) => (
                      <option key={asset._id} value={asset._id}>
                        {asset.name} ({asset.assetTag}) - {asset.location || 'No Location'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Select */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-[11px] text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Start</label>
                    <input
                      type="time"
                      required
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-[11px] text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">End</label>
                    <input
                      type="time"
                      required
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-[11px] text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Smart Availability Badge */}
                {formResource && (
                  <div className="p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors bg-slate-50/50 dark:bg-slate-950/30 border-slate-150 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Smart Check Status:</span>
                        <p className="text-[10px] text-slate-400">
                          {availabilityState.status === 'LOADING' && 'Querying schedules...'}
                          {availabilityState.status === 'AVAILABLE' && 'Asset is available'}
                          {availabilityState.status === 'BUSY' && 'Conflict: Resource is busy'}
                          {availabilityState.status === 'RESERVED' && 'Conflict: Resource is reserved'}
                          {availabilityState.status === 'MAINTENANCE' && 'Resource is under maintenance'}
                          {availabilityState.status === 'UNAVAILABLE' && 'Resource is retired / unavailable'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {availabilityState.status === 'LOADING' && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      )}
                      {availabilityState.status === 'AVAILABLE' && (
                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Available
                        </span>
                      )}
                      {(availabilityState.status === 'BUSY' || availabilityState.status === 'RESERVED') && (
                        <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                          Conflict
                        </span>
                      )}
                      {availabilityState.status === 'MAINTENANCE' && (
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                          Maintenance
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Conflicts suggestions panel inside drawer */}
                {conflictError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/35 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs text-rose-800 dark:text-rose-400">Overlap Detected</p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-500 leading-snug">
                          {conflictError.message}
                        </p>
                      </div>
                    </div>

                    {conflictError.suggestedSlots && conflictError.suggestedSlots.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-rose-100 dark:border-rose-900/30">
                        <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">Suggested Slots:</span>
                        <div className="grid grid-cols-1 gap-1">
                          {conflictError.suggestedSlots.slice(0, 3).map((slot, sIdx) => {
                            const st = new Date(slot.startTime);
                            const et = new Date(slot.endTime);
                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleSelectSuggestedSlot(slot)}
                                className="w-full text-left px-2 py-1.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 rounded-lg text-[10px] text-slate-700 dark:text-slate-350 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center justify-between"
                              >
                                <span className="font-semibold">
                                  {st.toLocaleDateString()} @ {st.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {et.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <ArrowRight className="h-3 w-3 text-rose-500" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Priority Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Booking Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPriority(p as any)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                          formPriority === p
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-950'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Participants selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Invite Participants (Multi-Select)
                  </label>
                  <select
                    multiple
                    value={formParticipants}
                    onChange={(e) => {
                      const options = e.target.options;
                      const selected: string[] = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) selected.push(options[i].value);
                      }
                      setFormParticipants(selected);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:bg-white h-24"
                  >
                    {employeesData?.data?.map((emp: any) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.department?.name || 'Staff'})
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Hold Ctrl (CMD) to select multiple participants.</span>
                </div>

                {/* Recurring Booking settings */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Is Recurring Booking?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsRecurring}
                        onChange={(e) => setFormIsRecurring(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {formIsRecurring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-slate-850 rounded-xl"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Recurrence Pattern</label>
                        <select
                          value={formRecurrencePattern}
                          onChange={(e: any) => setFormRecurrencePattern(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-800 dark:text-slate-105 focus:outline-none"
                        >
                          <option value="DAILY">Daily recurrence</option>
                          <option value="WEEKLY">Weekly recurrence</option>
                          <option value="MONTHLY">Monthly recurrence</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">End Date (Occurrence Limit)</label>
                        <input
                          type="date"
                          value={formRecurrenceUntil}
                          onChange={(e) => setFormRecurrenceUntil(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Attachment & Remarks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Attachment Link (Cloud URL)</label>
                  <input
                    type="text"
                    placeholder="Https://docs.google.com/presentation/..."
                    value={formAttachment}
                    onChange={(e) => setFormAttachment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Remarks / Booking Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on target agenda or setup instructions..."
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none h-16 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={createBookingMutation.isPending || availabilityState.status === 'MAINTENANCE' || availabilityState.status === 'UNAVAILABLE'}
                  className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4.5 w-4.5" />
                      Confirm Schedule Booking
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
