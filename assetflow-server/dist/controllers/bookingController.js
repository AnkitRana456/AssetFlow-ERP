"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookings = getBookings;
exports.getBookingCalendar = getBookingCalendar;
exports.getResourceAvailability = getResourceAvailability;
exports.getBookingHistory = getBookingHistory;
exports.getBookingById = getBookingById;
exports.createBooking = createBooking;
exports.updateBooking = updateBooking;
exports.rescheduleBooking = rescheduleBooking;
exports.deleteBooking = deleteBooking;
const Booking_1 = require("../models/Booking");
const Asset_1 = require("../models/Asset");
const User_1 = require("../models/User");
const ActivityLog_1 = require("../models/ActivityLog");
const Notification_1 = require("../models/Notification");
const conflictDetectionService_1 = require("../services/conflictDetectionService");
const calendarService_1 = require("../services/calendarService");
const socketService_1 = require("../socket/socketService");
const emailUtil_1 = require("../utils/emailUtil");
const crypto_1 = require("crypto");
/**
 * Helper: Notify creator and participants about a booking event
 */
async function notifyBookingEvent(booking, title, message, type, emailSenderFn) {
    try {
        const populated = await Booking_1.Booking.findById(booking._id)
            .populate('bookedBy')
            .populate('participants')
            .populate('resource');
        if (!populated)
            return;
        // Collect all unique user IDs to notify
        const userIds = new Set();
        if (populated.bookedBy)
            userIds.add(populated.bookedBy._id.toString());
        if (populated.participants) {
            populated.participants.forEach((p) => userIds.add(p._id.toString()));
        }
        // Create notifications and send emails
        for (const id of userIds) {
            const user = await User_1.User.findById(id);
            if (!user)
                continue;
            const notif = await Notification_1.Notification.create({
                receiver: user._id,
                title,
                message,
                type,
                link: `/bookings/${populated._id}`
            });
            // Send Socket
            socketService_1.socketService.emitToUser(user._id.toString(), 'notification', notif);
            // Send Email
            if (user.email) {
                try {
                    await emailSenderFn(user.email, `${user.firstName} ${user.lastName}`, populated);
                }
                catch (mailErr) {
                    console.error(`Failed to send email to ${user.email}:`, mailErr);
                }
            }
        }
    }
    catch (err) {
        console.error('Error in notifyBookingEvent:', err);
    }
}
/**
 * GET /api/bookings
 * Retrieve a paginated/filtered list of bookings
 */
async function getBookings(req, res, next) {
    try {
        const { search, status, department, resourceType, bookedBy, startDate, endDate, page = 1, limit = 10 } = req.query;
        const query = {};
        // 1. Role-based scoping
        // Employees can see all, but let's allow filtration by creator
        if (req.user?.role === User_1.UserRole.DEPARTMENT_HEAD) {
            // Dept head defaults to see department bookings, but can search wider if admin allows
            // For enterprise scope, let's allow filtering
        }
        // Apply Filters
        if (status) {
            query.status = status;
        }
        if (department) {
            query.department = department;
        }
        if (bookedBy) {
            query.bookedBy = bookedBy;
        }
        // Date Range filter
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                query.startTime.$lte = new Date(endDate);
            }
        }
        // Resource Type filter (needs populate/subquery)
        if (resourceType) {
            const assets = await Asset_1.Asset.find({ category: resourceType }).select('_id');
            const assetIds = assets.map(a => a._id);
            query.resource = { $in: assetIds };
        }
        // Search filter: booking title, remarks, purpose, or populated fields
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            // Let's search inside User and Asset to get matching IDs
            const [users, assets] = await Promise.all([
                User_1.User.find({
                    $or: [
                        { firstName: searchRegex },
                        { lastName: searchRegex },
                        { email: searchRegex }
                    ]
                }).select('_id'),
                Asset_1.Asset.find({ name: searchRegex }).select('_id')
            ]);
            const userIds = users.map(u => u._id);
            const assetIds = assets.map(a => a._id);
            query.$or = [
                { title: searchRegex },
                { remarks: searchRegex },
                { bookedBy: { $in: userIds } },
                { resource: { $in: assetIds } }
            ];
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [bookings, total] = await Promise.all([
            Booking_1.Booking.find(query)
                .populate('resource', 'name assetTag photo status category location')
                .populate('bookedBy', 'firstName lastName email role employeeId')
                .populate('department', 'name code')
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(limitNum),
            Booking_1.Booking.countDocuments(query)
        ]);
        res.status(200).json({
            bookings,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                totalBookings: total
            }
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/bookings/calendar
 * Fetch all active bookings formatted for FullCalendar
 */
async function getBookingCalendar(req, res, next) {
    try {
        const { start, end } = req.query;
        const query = {
            status: { $ne: Booking_1.BookingStatus.REJECTED }
        };
        if (start && end) {
            query.startTime = { $gte: new Date(start), $lte: new Date(end) };
        }
        const bookings = await Booking_1.Booking.find(query)
            .populate('resource', 'name location assetTag status')
            .populate('bookedBy', 'firstName lastName email')
            .populate('department', 'name code');
        // Map to FullCalendar event format
        const events = bookings.map(b => {
            // Determine priority color
            let color = '#3b82f6'; // blue
            if (b.priority === Booking_1.BookingPriority.HIGH)
                color = '#ef4444'; // red
            if (b.priority === Booking_1.BookingPriority.LOW)
                color = '#10b981'; // green
            if (b.status === Booking_1.BookingStatus.CANCELLED)
                color = '#64748b'; // slate grey
            return {
                id: b._id,
                title: b.title,
                start: b.startTime,
                end: b.endTime,
                backgroundColor: color,
                borderColor: color,
                extendedProps: {
                    resourceName: b.resource?.name,
                    location: b.resource?.location,
                    bookedByName: b.bookedBy?.fullName || `${b.bookedBy?.firstName} ${b.bookedBy?.lastName}`,
                    departmentCode: b.department?.code,
                    priority: b.priority,
                    status: b.status,
                    isRecurring: b.isRecurring
                }
            };
        });
        res.status(200).json(events);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/bookings/availability
 * Check resource state or timeline
 */
async function getResourceAvailability(req, res, next) {
    try {
        const { resourceId, date, startTime, endTime } = req.query;
        if (!date) {
            res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
            return;
        }
        if (resourceId && startTime && endTime) {
            // Check specific availability window
            const checkResult = await calendarService_1.CalendarService.getResourceStatus(resourceId, new Date(startTime), new Date(endTime));
            let suggestions = [];
            if (checkResult.status === 'BUSY' || checkResult.status === 'RESERVED') {
                // Find next slots
                suggestions = await conflictDetectionService_1.ConflictDetectionService.suggestNextAvailableSlots(resourceId, new Date(startTime), new Date(endTime));
            }
            res.status(200).json({
                available: checkResult.status === 'AVAILABLE',
                status: checkResult.status,
                detail: checkResult.detail,
                suggestions
            });
            return;
        }
        else if (resourceId) {
            // Return daily timeline
            const timeline = await calendarService_1.CalendarService.getDailyTimeline(resourceId, date);
            res.status(200).json(timeline);
            return;
        }
        // Default: return list of bookable resources with their state for that date
        const assets = await Asset_1.Asset.find({ bookable: true, deletedAt: null })
            .populate('category', 'name icon');
        const result = [];
        for (const asset of assets) {
            const timeline = await calendarService_1.CalendarService.getDailyTimeline(asset._id.toString(), date);
            result.push({
                resourceId: asset._id,
                name: asset.name,
                assetTag: asset.assetTag,
                location: asset.location,
                status: asset.status,
                category: asset.category?.name,
                timeline
            });
        }
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/bookings/history
 * Fetch history/activity logs for bookings
 */
async function getBookingHistory(req, res, next) {
    try {
        const { bookingId } = req.query;
        const query = { module: 'BOOKINGS' };
        if (bookingId) {
            query.entityId = bookingId;
        }
        const logs = await ActivityLog_1.ActivityLog.find(query)
            .populate('user', 'firstName lastName email role')
            .sort({ createdAt: -1 });
        res.status(200).json(logs);
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/bookings/:id
 * Retrieve booking details by ID
 */
async function getBookingById(req, res, next) {
    try {
        const { id } = req.params;
        const booking = await Booking_1.Booking.findById(id)
            .populate('resource')
            .populate('bookedBy', 'firstName lastName email role employeeId phone avatar')
            .populate('department', 'name code location')
            .populate('participants', 'firstName lastName email employeeId avatar')
            .populate('cancelledBy', 'firstName lastName email');
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        res.status(200).json(booking);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/bookings
 * Create new single or recurring booking
 */
async function createBooking(req, res, next) {
    try {
        const { title, resource, startTime, endTime, priority, remarks, participants = [], isRecurring = false, recurrencePattern, recurrenceUntil, attachment } = req.body;
        // 1. Verify Resource exists, is bookable, is not retired/under maintenance
        const asset = await Asset_1.Asset.findById(resource);
        if (!asset) {
            res.status(404).json({ message: 'Resource not found' });
            return;
        }
        if (asset.deletedAt) {
            res.status(400).json({ message: 'Resource has been deleted' });
            return;
        }
        if (!asset.bookable) {
            res.status(400).json({ message: 'Resource is not configured as bookable' });
            return;
        }
        if (asset.status === Asset_1.AssetStatus.RETIRED || asset.status === Asset_1.AssetStatus.DISPOSED) {
            res.status(400).json({ message: 'Resource is retired or disposed. Cannot book.' });
            return;
        }
        if (asset.status === Asset_1.AssetStatus.UNDER_MAINTENANCE) {
            res.status(400).json({ message: 'Resource is under maintenance. Cannot book.' });
            return;
        }
        // Resolve booking department
        const user = await User_1.User.findById(req.user?.userId).populate('department');
        if (!user) {
            res.status(401).json({ message: 'Authenticated user profile not found' });
            return;
        }
        const userDeptId = user.department?._id || asset.department;
        if (!userDeptId) {
            res.status(400).json({ message: 'Department is required for booking registration.' });
            return;
        }
        const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
        // 2. Overlap Conflict Checks
        if (!isRecurring) {
            const conflictCheck = await conflictDetectionService_1.ConflictDetectionService.checkConflict(resource, new Date(startTime), new Date(endTime));
            if (conflictCheck.hasConflict) {
                const nextSlots = await conflictDetectionService_1.ConflictDetectionService.suggestNextAvailableSlots(resource, new Date(startTime), new Date(endTime));
                res.status(409).json({
                    message: 'Overlapping Booking Error: The resource is busy during the requested time.',
                    conflictingBooking: conflictCheck.conflictingBooking,
                    suggestedSlots: nextSlots
                });
                return;
            }
            // Create Single Booking
            const booking = await Booking_1.Booking.create({
                title,
                resource,
                bookedBy: req.user?.userId,
                department: userDeptId,
                participants,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                date: new Date(startTime),
                priority: priority || Booking_1.BookingPriority.MEDIUM,
                remarks,
                attachment,
                status: Booking_1.BookingStatus.UPCOMING
            });
            // Logging & Notifications
            await ActivityLog_1.ActivityLog.create({
                user: req.user?.userId,
                action: 'BOOKING_CREATE',
                module: 'BOOKINGS',
                entityId: booking._id.toString(),
                newData: booking,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            socketService_1.socketService.emitToAll('calendar_update', { message: 'New booking created', bookingId: booking._id });
            await notifyBookingEvent(booking, 'Booking Confirmed', `Your booking "${booking.title}" for "${asset.name}" has been confirmed.`, Notification_1.NotificationType.SUCCESS, emailUtil_1.sendBookingConfirmationEmail);
            res.status(201).json(booking);
            return;
        }
        else {
            // Recurrence series expansion
            const occurrences = [];
            let currentStart = new Date(startTime);
            const until = recurrenceUntil ? new Date(recurrenceUntil) : new Date(currentStart.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days max limit
            const maxOccurrences = 50;
            let count = 0;
            while (currentStart <= until && count < maxOccurrences) {
                occurrences.push(new Date(currentStart));
                if (recurrencePattern === Booking_1.RecurrencePattern.DAILY) {
                    currentStart.setDate(currentStart.getDate() + 1);
                }
                else if (recurrencePattern === Booking_1.RecurrencePattern.WEEKLY) {
                    currentStart.setDate(currentStart.getDate() + 7);
                }
                else if (recurrencePattern === Booking_1.RecurrencePattern.MONTHLY) {
                    currentStart.setMonth(currentStart.getMonth() + 1);
                }
                count++;
            }
            // Check conflicts for ALL occurrences
            const conflicts = [];
            for (const startVal of occurrences) {
                const endVal = new Date(startVal.getTime() + durationMs);
                const conflictResult = await conflictDetectionService_1.ConflictDetectionService.checkConflict(resource, startVal, endVal);
                if (conflictResult.hasConflict) {
                    conflicts.push({
                        date: startVal.toLocaleDateString(),
                        conflict: conflictResult.conflictingBooking
                    });
                }
            }
            if (conflicts.length > 0) {
                res.status(409).json({
                    message: 'Series overlapping conflict: One or more recurring bookings overlap with existing slots.',
                    conflicts
                });
                return;
            }
            // Create sequence
            const groupId = (0, crypto_1.randomUUID)();
            const createdBookings = [];
            for (const startVal of occurrences) {
                const endVal = new Date(startVal.getTime() + durationMs);
                const booking = await Booking_1.Booking.create({
                    title,
                    resource,
                    bookedBy: req.user?.userId,
                    department: userDeptId,
                    participants,
                    startTime: startVal,
                    endTime: endVal,
                    date: startVal,
                    priority: priority || Booking_1.BookingPriority.MEDIUM,
                    remarks,
                    attachment,
                    status: Booking_1.BookingStatus.UPCOMING,
                    isRecurring: true,
                    recurringGroupId: groupId,
                    recurrencePattern,
                    recurrenceUntil: new Date(until)
                });
                createdBookings.push(booking);
            }
            // Log first block
            await ActivityLog_1.ActivityLog.create({
                user: req.user?.userId,
                action: 'BOOKING_CREATE_RECURRING',
                module: 'BOOKINGS',
                entityId: createdBookings[0]._id.toString(),
                newData: { groupId, count: createdBookings.length, series: createdBookings },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            socketService_1.socketService.emitToAll('calendar_update', { message: 'Recurring bookings created' });
            // Notify for first booking
            await notifyBookingEvent(createdBookings[0], 'Recurring Booking Confirmed', `Your recurring series "${title}" for "${asset.name}" has been confirmed (${createdBookings.length} occurrences).`, Notification_1.NotificationType.SUCCESS, emailUtil_1.sendBookingConfirmationEmail);
            res.status(201).json(createdBookings);
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * PATCH /api/bookings/:id
 * Partially update metadata (e.g. title, priority, remarks, participants)
 */
async function updateBooking(req, res, next) {
    try {
        const { id } = req.params;
        const { title, priority, remarks, participants, attachment } = req.body;
        const booking = await Booking_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        // Access control
        if (req.user?.role !== User_1.UserRole.ADMIN && req.user?.role !== User_1.UserRole.ASSET_MANAGER && booking.bookedBy.toString() !== req.user?.userId) {
            res.status(403).json({ message: 'Forbidden. You do not have permission to modify this booking.' });
            return;
        }
        const oldData = { ...booking.toJSON() };
        if (title)
            booking.title = title;
        if (priority)
            booking.priority = priority;
        if (remarks)
            booking.remarks = remarks;
        if (participants)
            booking.participants = participants;
        if (attachment)
            booking.attachment = attachment;
        await booking.save();
        await ActivityLog_1.ActivityLog.create({
            user: req.user?.userId,
            action: 'BOOKING_UPDATE',
            module: 'BOOKINGS',
            entityId: booking._id.toString(),
            oldData,
            newData: booking,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        socketService_1.socketService.emitToAll('calendar_update', { message: 'Booking details updated', bookingId: booking._id });
        res.status(200).json(booking);
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/bookings/reschedule
 * Reschedule booking dates/times/resources with full conflict validation
 */
async function rescheduleBooking(req, res, next) {
    try {
        const { bookingId, startTime, endTime, resourceId, rescheduleSeries = false } = req.body;
        const booking = await Booking_1.Booking.findById(bookingId);
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        // Access control
        if (req.user?.role !== User_1.UserRole.ADMIN && req.user?.role !== User_1.UserRole.ASSET_MANAGER && booking.bookedBy.toString() !== req.user?.userId) {
            res.status(403).json({ message: 'Forbidden. You cannot reschedule this booking.' });
            return;
        }
        const targetResource = resourceId || booking.resource.toString();
        const start = new Date(startTime);
        const end = new Date(endTime);
        // Verify target asset status
        const asset = await Asset_1.Asset.findById(targetResource);
        if (!asset || asset.status === Asset_1.AssetStatus.RETIRED || asset.status === Asset_1.AssetStatus.UNDER_MAINTENANCE) {
            res.status(400).json({ message: 'Selected resource is retired, under maintenance, or invalid.' });
            return;
        }
        if (!rescheduleSeries || !booking.isRecurring || !booking.recurringGroupId) {
            // Single booking reschedule
            const conflictCheck = await conflictDetectionService_1.ConflictDetectionService.checkConflict(targetResource, start, end, bookingId);
            if (conflictCheck.hasConflict) {
                const suggestions = await conflictDetectionService_1.ConflictDetectionService.suggestNextAvailableSlots(targetResource, start, end, bookingId);
                res.status(409).json({
                    message: 'Overlapping Reschedule Error: Resource is busy during the requested time.',
                    conflictingBooking: conflictCheck.conflictingBooking,
                    suggestedSlots: suggestions
                });
                return;
            }
            const oldData = { ...booking.toJSON() };
            booking.startTime = start;
            booking.endTime = end;
            booking.date = start;
            booking.resource = targetResource;
            booking.status = Booking_1.BookingStatus.UPCOMING; // reset status back to upcoming if it was ongoing or changed
            await booking.save();
            await ActivityLog_1.ActivityLog.create({
                user: req.user?.userId,
                action: 'BOOKING_RESCHEDULE',
                module: 'BOOKINGS',
                entityId: booking._id.toString(),
                oldData,
                newData: booking,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            socketService_1.socketService.emitToAll('calendar_update', { message: 'Booking rescheduled', bookingId: booking._id });
            await notifyBookingEvent(booking, 'Booking Rescheduled', `Your booking "${booking.title}" has been rescheduled to start on ${start.toLocaleString()}.`, Notification_1.NotificationType.INFO, emailUtil_1.sendBookingRescheduledEmail);
            res.status(200).json(booking);
        }
        else {
            // Series reschedule
            const groupId = booking.recurringGroupId;
            const series = await Booking_1.Booking.find({ recurringGroupId: groupId, status: { $ne: Booking_1.BookingStatus.CANCELLED } }).sort({ startTime: 1 });
            const durationMs = end.getTime() - start.getTime();
            const offsetMs = start.getTime() - booking.startTime.getTime();
            // Check conflicts for all items
            const conflicts = [];
            for (const item of series) {
                const itemNewStart = new Date(item.startTime.getTime() + offsetMs);
                const itemNewEnd = new Date(itemNewStart.getTime() + durationMs);
                const conflictCheck = await conflictDetectionService_1.ConflictDetectionService.checkConflict(targetResource, itemNewStart, itemNewEnd, item._id.toString());
                if (conflictCheck.hasConflict) {
                    conflicts.push({
                        date: itemNewStart.toLocaleDateString(),
                        conflict: conflictCheck.conflictingBooking
                    });
                }
            }
            if (conflicts.length > 0) {
                res.status(409).json({
                    message: 'Series reschedule conflict: One or more bookings in the series will overlap.',
                    conflicts
                });
                return;
            }
            // Commit changes
            const updatedItems = [];
            for (const item of series) {
                const oldData = { ...item.toJSON() };
                const itemNewStart = new Date(item.startTime.getTime() + offsetMs);
                const itemNewEnd = new Date(itemNewStart.getTime() + durationMs);
                item.startTime = itemNewStart;
                item.endTime = itemNewEnd;
                item.date = itemNewStart;
                item.resource = targetResource;
                item.status = Booking_1.BookingStatus.UPCOMING;
                await item.save();
                await ActivityLog_1.ActivityLog.create({
                    user: req.user?.userId,
                    action: 'BOOKING_RESCHEDULE_SERIES',
                    module: 'BOOKINGS',
                    entityId: item._id.toString(),
                    oldData,
                    newData: item,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });
                updatedItems.push(item);
            }
            socketService_1.socketService.emitToAll('calendar_update', { message: 'Recurring series rescheduled' });
            await notifyBookingEvent(updatedItems[0], 'Recurring Booking Series Rescheduled', `Your recurring series "${booking.title}" has been rescheduled.`, Notification_1.NotificationType.INFO, emailUtil_1.sendBookingRescheduledEmail);
            res.status(200).json(updatedItems);
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/bookings/:id
 * Cancel booking and capture details (cancellationReason is required in body)
 */
async function deleteBooking(req, res, next) {
    try {
        const { id } = req.params;
        const { cancellationReason, cancelSeries = false } = req.body;
        if (!cancellationReason) {
            res.status(400).json({ message: 'Cancellation reason is required.' });
            return;
        }
        const booking = await Booking_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        // Permissions
        if (req.user?.role !== User_1.UserRole.ADMIN && req.user?.role !== User_1.UserRole.ASSET_MANAGER && booking.bookedBy.toString() !== req.user?.userId) {
            res.status(403).json({ message: 'Forbidden. You do not have permission to cancel this booking.' });
            return;
        }
        if (!cancelSeries || !booking.isRecurring || !booking.recurringGroupId) {
            // Cancel single
            const oldData = { ...booking.toJSON() };
            booking.status = Booking_1.BookingStatus.CANCELLED;
            booking.cancellationReason = cancellationReason;
            booking.cancelledBy = req.user?.userId;
            booking.cancelledAt = new Date();
            await booking.save();
            await ActivityLog_1.ActivityLog.create({
                user: req.user?.userId,
                action: 'BOOKING_CANCEL',
                module: 'BOOKINGS',
                entityId: booking._id.toString(),
                oldData,
                newData: booking,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            socketService_1.socketService.emitToAll('calendar_update', { message: 'Booking cancelled', bookingId: booking._id });
            await notifyBookingEvent(booking, 'Booking Cancelled', `Booking "${booking.title}" has been cancelled. Reason: ${cancellationReason}`, Notification_1.NotificationType.WARNING, emailUtil_1.sendBookingCancellationEmail);
            res.status(200).json({ message: 'Booking cancelled successfully', booking });
        }
        else {
            // Cancel series from current onwards
            const groupId = booking.recurringGroupId;
            const series = await Booking_1.Booking.find({
                recurringGroupId: groupId,
                startTime: { $gte: booking.startTime },
                status: { $ne: Booking_1.BookingStatus.CANCELLED }
            });
            const cancelledItems = [];
            for (const item of series) {
                const oldData = { ...item.toJSON() };
                item.status = Booking_1.BookingStatus.CANCELLED;
                item.cancellationReason = cancellationReason;
                item.cancelledBy = req.user?.userId;
                item.cancelledAt = new Date();
                await item.save();
                await ActivityLog_1.ActivityLog.create({
                    user: req.user?.userId,
                    action: 'BOOKING_CANCEL_SERIES',
                    module: 'BOOKINGS',
                    entityId: item._id.toString(),
                    oldData,
                    newData: item,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });
                cancelledItems.push(item);
            }
            socketService_1.socketService.emitToAll('calendar_update', { message: 'Recurring booking series cancelled' });
            await notifyBookingEvent(booking, 'Recurring Booking Series Cancelled', `Your recurring series "${booking.title}" has been cancelled. Reason: ${cancellationReason}`, Notification_1.NotificationType.WARNING, emailUtil_1.sendBookingCancellationEmail);
            res.status(200).json({ message: 'Recurring series cancelled successfully', cancelledCount: cancelledItems.length });
        }
    }
    catch (error) {
        next(error);
    }
}
