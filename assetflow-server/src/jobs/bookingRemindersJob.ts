import cron from 'node-cron';
import { Booking, BookingStatus } from '../models/Booking';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { socketService } from '../socket/socketService';
import { ActivityLog } from '../models/ActivityLog';
import { sendBookingReminderEmail } from '../utils/emailUtil';

// Set to track sent reminders in-memory to prevent double-sending within the same minute
const sentRemindersCache = new Set<string>();

export async function processBookingRemindersAndTransitions(): Promise<void> {
  const now = new Date();

  try {
    // 1. Transition UPCOMING -> ONGOING
    const upcomingToOngoing = await Booking.find({
      status: BookingStatus.UPCOMING,
      startTime: { $lte: now }
    }).populate('resource');

    for (const booking of upcomingToOngoing) {
      booking.status = BookingStatus.ONGOING;
      await booking.save();

      await ActivityLog.create({
        action: 'BOOKING_START',
        module: 'BOOKINGS',
        entityId: booking._id.toString(),
        newData: { status: BookingStatus.ONGOING },
        ipAddress: '127.0.0.1',
        userAgent: 'System Cron Job'
      });

      socketService.emitToAll('calendar_update', { message: `Booking "${booking.title}" is now ongoing.`, bookingId: booking._id });
    }

    // 2. Transition ONGOING -> COMPLETED
    const ongoingToCompleted = await Booking.find({
      status: BookingStatus.ONGOING,
      endTime: { $lte: now }
    }).populate('resource');

    for (const booking of ongoingToCompleted) {
      booking.status = BookingStatus.COMPLETED;
      await booking.save();

      await ActivityLog.create({
        action: 'BOOKING_COMPLETE',
        module: 'BOOKINGS',
        entityId: booking._id.toString(),
        newData: { status: BookingStatus.COMPLETED },
        ipAddress: '127.0.0.1',
        userAgent: 'System Cron Job'
      });

      socketService.emitToAll('calendar_update', { message: `Booking "${booking.title}" is completed.`, bookingId: booking._id });
    }

    // 3. Reminders Check (15 minutes, 1 hour, 1 day)
    // Run checks for intervals
    const reminderIntervals = [
      { label: '15m', min: 14, max: 15 },
      { label: '1h', min: 59, max: 60 },
      { label: '1d', min: 24 * 60 - 1, max: 24 * 60 }
    ];

    for (const interval of reminderIntervals) {
      const startRange = new Date(now.getTime() + interval.min * 60 * 1000);
      const endRange = new Date(now.getTime() + interval.max * 60 * 1000);

      const bookingsToRemind = await Booking.find({
        status: BookingStatus.UPCOMING,
        startTime: { $gte: startRange, $lte: endRange }
      }).populate('bookedBy participants resource');

      for (const booking of bookingsToRemind) {
        const cacheKey = `${booking._id}_${interval.label}`;
        if (sentRemindersCache.has(cacheKey)) continue;

        // Collect recipients (creator + participants)
        const recipients = new Set<string>();
        if (booking.bookedBy) recipients.add(booking.bookedBy._id.toString());
        if (booking.participants) {
          booking.participants.forEach((p: any) => recipients.add(p._id.toString()));
        }

        for (const recipientId of recipients) {
          const user = await User.findById(recipientId);
          if (!user) continue;

          // Create notification
          const notif = await Notification.create({
            receiver: user._id,
            title: `Reminder: ${booking.title}`,
            message: `Your booking for "${booking.resource?.name || 'Shared Resource'}" starts in ${interval.label === '1d' ? '1 day' : interval.label === '1h' ? '1 hour' : '15 minutes'} (at ${new Date(booking.startTime).toLocaleTimeString()}).`,
            type: NotificationType.INFO,
            link: `/bookings/${booking._id}`
          });

          socketService.emitToUser(user._id.toString(), 'notification', notif);

          // Email
          if (user.email) {
            try {
              await sendBookingReminderEmail(user.email, `${user.firstName} ${user.lastName}`, booking);
            } catch (err) {
              console.error(`Reminder email error to ${user.email}:`, err);
            }
          }
        }

        sentRemindersCache.add(cacheKey);
      }
    }

    // Clean up cache to prevent unbounded growth (older than 2 days)
    if (sentRemindersCache.size > 2000) {
      sentRemindersCache.clear();
    }
  } catch (error) {
    console.error('❌ Error in processBookingRemindersAndTransitions job:', error);
  }
}

export function startBookingJobs(): void {
  // Run every minute (* * * * *)
  cron.schedule('* * * * *', async () => {
    await processBookingRemindersAndTransitions();
  });
  console.log('⏰ Booking status transition & reminders job scheduled to run every minute.');
}
