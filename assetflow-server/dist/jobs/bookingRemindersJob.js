"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBookingRemindersAndTransitions = processBookingRemindersAndTransitions;
exports.startBookingJobs = startBookingJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const Booking_1 = require("../models/Booking");
const Notification_1 = require("../models/Notification");
const User_1 = require("../models/User");
const socketService_1 = require("../socket/socketService");
const ActivityLog_1 = require("../models/ActivityLog");
const emailUtil_1 = require("../utils/emailUtil");
// Set to track sent reminders in-memory to prevent double-sending within the same minute
const sentRemindersCache = new Set();
async function processBookingRemindersAndTransitions() {
    const now = new Date();
    try {
        // 1. Transition UPCOMING -> ONGOING
        const upcomingToOngoing = await Booking_1.Booking.find({
            status: Booking_1.BookingStatus.UPCOMING,
            startTime: { $lte: now }
        }).populate('resource');
        for (const booking of upcomingToOngoing) {
            booking.status = Booking_1.BookingStatus.ONGOING;
            await booking.save();
            await ActivityLog_1.ActivityLog.create({
                action: 'BOOKING_START',
                module: 'BOOKINGS',
                entityId: booking._id.toString(),
                newData: { status: Booking_1.BookingStatus.ONGOING },
                ipAddress: '127.0.0.1',
                userAgent: 'System Cron Job'
            });
            socketService_1.socketService.emitToAll('calendar_update', { message: `Booking "${booking.title}" is now ongoing.`, bookingId: booking._id });
        }
        // 2. Transition ONGOING -> COMPLETED
        const ongoingToCompleted = await Booking_1.Booking.find({
            status: Booking_1.BookingStatus.ONGOING,
            endTime: { $lte: now }
        }).populate('resource');
        for (const booking of ongoingToCompleted) {
            booking.status = Booking_1.BookingStatus.COMPLETED;
            await booking.save();
            await ActivityLog_1.ActivityLog.create({
                action: 'BOOKING_COMPLETE',
                module: 'BOOKINGS',
                entityId: booking._id.toString(),
                newData: { status: Booking_1.BookingStatus.COMPLETED },
                ipAddress: '127.0.0.1',
                userAgent: 'System Cron Job'
            });
            socketService_1.socketService.emitToAll('calendar_update', { message: `Booking "${booking.title}" is completed.`, bookingId: booking._id });
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
            const bookingsToRemind = await Booking_1.Booking.find({
                status: Booking_1.BookingStatus.UPCOMING,
                startTime: { $gte: startRange, $lte: endRange }
            }).populate('bookedBy participants resource');
            for (const booking of bookingsToRemind) {
                const cacheKey = `${booking._id}_${interval.label}`;
                if (sentRemindersCache.has(cacheKey))
                    continue;
                // Collect recipients (creator + participants)
                const recipients = new Set();
                if (booking.bookedBy)
                    recipients.add(booking.bookedBy._id.toString());
                if (booking.participants) {
                    booking.participants.forEach((p) => recipients.add(p._id.toString()));
                }
                for (const recipientId of recipients) {
                    const user = await User_1.User.findById(recipientId);
                    if (!user)
                        continue;
                    // Create notification
                    const notif = await Notification_1.Notification.create({
                        receiver: user._id,
                        title: `Reminder: ${booking.title}`,
                        message: `Your booking for "${booking.resource?.name || 'Shared Resource'}" starts in ${interval.label === '1d' ? '1 day' : interval.label === '1h' ? '1 hour' : '15 minutes'} (at ${new Date(booking.startTime).toLocaleTimeString()}).`,
                        type: Notification_1.NotificationType.INFO,
                        link: `/bookings/${booking._id}`
                    });
                    socketService_1.socketService.emitToUser(user._id.toString(), 'notification', notif);
                    // Email
                    if (user.email) {
                        try {
                            await (0, emailUtil_1.sendBookingReminderEmail)(user.email, `${user.firstName} ${user.lastName}`, booking);
                        }
                        catch (err) {
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
    }
    catch (error) {
        console.error('❌ Error in processBookingRemindersAndTransitions job:', error);
    }
}
function startBookingJobs() {
    // Run every minute (* * * * *)
    node_cron_1.default.schedule('* * * * *', async () => {
        await processBookingRemindersAndTransitions();
    });
    console.log('⏰ Booking status transition & reminders job scheduled to run every minute.');
}
