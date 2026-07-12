import { Request, Response, NextFunction } from 'express';
import { Booking, BookingStatus, BookingPriority, RecurrencePattern } from '../models/Booking';
import { Asset, AssetStatus } from '../models/Asset';
import { User, UserRole } from '../models/User';
import { Department } from '../models/Department';
import { ActivityLog } from '../models/ActivityLog';
import { Notification, NotificationType } from '../models/Notification';
import { ConflictDetectionService } from '../services/conflictDetectionService';
import { CalendarService } from '../services/calendarService';
import { socketService } from '../socket/socketService';
import { 
  sendBookingConfirmationEmail, 
  sendBookingCancellationEmail, 
  sendBookingRescheduledEmail 
} from '../utils/emailUtil';
import { randomUUID } from 'crypto';


/**
 * Helper: Notify creator and participants about a booking event
 */
async function notifyBookingEvent(
  booking: any, 
  title: string, 
  message: string, 
  type: NotificationType, 
  emailSenderFn: (email: string, name: string, booking: any) => Promise<void>
) {
  try {
    const populated = await Booking.findById(booking._id)
      .populate('bookedBy')
      .populate('participants')
      .populate('resource');

    if (!populated) return;

    // Collect all unique user IDs to notify
    const userIds = new Set<string>();
    if (populated.bookedBy) userIds.add(populated.bookedBy._id.toString());
    if (populated.participants) {
      populated.participants.forEach((p: any) => userIds.add(p._id.toString()));
    }

    // Create notifications and send emails
    for (const id of userIds) {
      const user = await User.findById(id);
      if (!user) continue;

      const notif = await Notification.create({
        receiver: user._id,
        title,
        message,
        type,
        link: `/bookings/${populated._id}`
      });

      // Send Socket
      socketService.emitToUser(user._id.toString(), 'notification', notif);

      // Send Email
      if (user.email) {
        try {
          await emailSenderFn(user.email, `${user.firstName} ${user.lastName}`, populated);
        } catch (mailErr) {
          console.error(`Failed to send email to ${user.email}:`, mailErr);
        }
      }
    }
  } catch (err) {
    console.error('Error in notifyBookingEvent:', err);
  }
}

/**
 * GET /api/bookings
 * Retrieve a paginated/filtered list of bookings
 */
export async function getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      search, 
      status, 
      department, 
      resourceType, 
      bookedBy, 
      startDate, 
      endDate,
      page = 1,
      limit = 10 
    } = req.query;

    const query: any = {};

    // 1. Role-based scoping
    // Employees can see all, but let's allow filtration by creator
    if (req.user?.role === UserRole.DEPARTMENT_HEAD) {
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
        query.startTime.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate as string);
      }
    }

    // Resource Type filter (needs populate/subquery)
    if (resourceType) {
      const assets = await Asset.find({ category: resourceType }).select('_id');
      const assetIds = assets.map(a => a._id);
      query.resource = { $in: assetIds };
    }

    // Search filter: booking title, remarks, purpose, or populated fields
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      
      // Let's search inside User and Asset to get matching IDs
      const [users, assets] = await Promise.all([
        User.find({
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
          ]
        }).select('_id'),
        Asset.find({ name: searchRegex }).select('_id')
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

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('resource', 'name assetTag photo status category location')
        .populate('bookedBy', 'firstName lastName email role employeeId')
        .populate('department', 'name code')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query)
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
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings/calendar
 * Fetch all active bookings formatted for FullCalendar
 */
export async function getBookingCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { start, end } = req.query;

    const query: any = {
      status: { $ne: BookingStatus.REJECTED }
    };

    if (start && end) {
      query.startTime = { $gte: new Date(start as string), $lte: new Date(end as string) };
    }

    const bookings = await Booking.find(query)
      .populate('resource', 'name location assetTag status')
      .populate('bookedBy', 'firstName lastName email')
      .populate('department', 'name code');

    // Map to FullCalendar event format
    const events = bookings.map(b => {
      // Determine priority color
      let color = '#3b82f6'; // blue
      if (b.priority === BookingPriority.HIGH) color = '#ef4444'; // red
      if (b.priority === BookingPriority.LOW) color = '#10b981'; // green

      if (b.status === BookingStatus.CANCELLED) color = '#64748b'; // slate grey

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
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings/availability
 * Check resource state or timeline
 */
export async function getResourceAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resourceId, date, startTime, endTime } = req.query;

    if (!date) {
      res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
      return;
    }

    if (resourceId && startTime && endTime) {
      // Check specific availability window
      const checkResult = await CalendarService.getResourceStatus(
        resourceId as string,
        new Date(startTime as string),
        new Date(endTime as string)
      );

      let suggestions: any[] = [];
      if (checkResult.status === 'BUSY' || checkResult.status === 'RESERVED') {
        // Find next slots
        suggestions = await ConflictDetectionService.suggestNextAvailableSlots(
          resourceId as string,
          new Date(startTime as string),
          new Date(endTime as string)
        );
      }

      res.status(200).json({
        available: checkResult.status === 'AVAILABLE',
        status: checkResult.status,
        detail: checkResult.detail,
        suggestions
      });
      return;
    } else if (resourceId) {
      // Return daily timeline
      const timeline = await CalendarService.getDailyTimeline(resourceId as string, date as string);
      res.status(200).json(timeline);
      return;
    }

    // Default: return list of bookable resources with their state for that date
    const assets = await Asset.find({ bookable: true, deletedAt: null })
      .populate('category', 'name icon');

    const result = [];
    for (const asset of assets) {
      const timeline = await CalendarService.getDailyTimeline(asset._id.toString(), date as string);
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
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings/history
 * Fetch history/activity logs for bookings
 */
export async function getBookingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookingId } = req.query;
    
    const query: any = { module: 'BOOKINGS' };
    if (bookingId) {
      query.entityId = bookingId;
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings/:id
 * Retrieve booking details by ID
 */
export async function getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
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
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/bookings
 * Create new single or recurring booking
 */
export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      title, 
      resource, 
      startTime, 
      endTime, 
      priority, 
      remarks, 
      participants = [], 
      isRecurring = false,
      recurrencePattern,
      recurrenceUntil,
      attachment
    } = req.body;

    // 1. Verify Resource exists, is bookable, is not retired/under maintenance
    const asset = await Asset.findById(resource);
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

    if (asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED) {
      res.status(400).json({ message: 'Resource is retired or disposed. Cannot book.' });
      return;
    }

    if (asset.status === AssetStatus.UNDER_MAINTENANCE) {
      res.status(400).json({ message: 'Resource is under maintenance. Cannot book.' });
      return;
    }

    // Resolve booking department
    const user = await User.findById(req.user?.userId).populate('department');
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
      const conflictCheck = await ConflictDetectionService.checkConflict(resource, new Date(startTime), new Date(endTime));
      if (conflictCheck.hasConflict) {
        const nextSlots = await ConflictDetectionService.suggestNextAvailableSlots(resource, new Date(startTime), new Date(endTime));
        res.status(409).json({
          message: 'Overlapping Booking Error: The resource is busy during the requested time.',
          conflictingBooking: conflictCheck.conflictingBooking,
          suggestedSlots: nextSlots
        });
        return;
      }

      // Create Single Booking
      const booking = await Booking.create({
        title,
        resource,
        bookedBy: req.user?.userId,
        department: userDeptId,
        participants,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        date: new Date(startTime),
        priority: priority || BookingPriority.MEDIUM,
        remarks,
        attachment,
        status: BookingStatus.UPCOMING
      });

      // Logging & Notifications
      await ActivityLog.create({
        user: req.user?.userId,
        action: 'BOOKING_CREATE',
        module: 'BOOKINGS',
        entityId: booking._id.toString(),
        newData: booking,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      socketService.emitToAll('calendar_update', { message: 'New booking created', bookingId: booking._id });

      await notifyBookingEvent(
        booking,
        'Booking Confirmed',
        `Your booking "${booking.title}" for "${asset.name}" has been confirmed.`,
        NotificationType.SUCCESS,
        sendBookingConfirmationEmail
      );

      res.status(201).json(booking);
      return;
    } else {
      // Recurrence series expansion
      const occurrences: Date[] = [];
      let currentStart = new Date(startTime);
      const until = recurrenceUntil ? new Date(recurrenceUntil) : new Date(currentStart.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days max limit

      const maxOccurrences = 50;
      let count = 0;

      while (currentStart <= until && count < maxOccurrences) {
        occurrences.push(new Date(currentStart));
        
        if (recurrencePattern === RecurrencePattern.DAILY) {
          currentStart.setDate(currentStart.getDate() + 1);
        } else if (recurrencePattern === RecurrencePattern.WEEKLY) {
          currentStart.setDate(currentStart.getDate() + 7);
        } else if (recurrencePattern === RecurrencePattern.MONTHLY) {
          currentStart.setMonth(currentStart.getMonth() + 1);
        }
        count++;
      }

      // Check conflicts for ALL occurrences
      const conflicts: Array<{ date: string; conflict: any }> = [];
      for (const startVal of occurrences) {
        const endVal = new Date(startVal.getTime() + durationMs);
        const conflictResult = await ConflictDetectionService.checkConflict(resource, startVal, endVal);
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
      const groupId = randomUUID();
      const createdBookings = [];


      for (const startVal of occurrences) {
        const endVal = new Date(startVal.getTime() + durationMs);
        const booking = await Booking.create({
          title,
          resource,
          bookedBy: req.user?.userId,
          department: userDeptId,
          participants,
          startTime: startVal,
          endTime: endVal,
          date: startVal,
          priority: priority || BookingPriority.MEDIUM,
          remarks,
          attachment,
          status: BookingStatus.UPCOMING,
          isRecurring: true,
          recurringGroupId: groupId,
          recurrencePattern,
          recurrenceUntil: new Date(until)
        });
        createdBookings.push(booking);
      }

      // Log first block
      await ActivityLog.create({
        user: req.user?.userId,
        action: 'BOOKING_CREATE_RECURRING',
        module: 'BOOKINGS',
        entityId: createdBookings[0]._id.toString(),
        newData: { groupId, count: createdBookings.length, series: createdBookings },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      socketService.emitToAll('calendar_update', { message: 'Recurring bookings created' });

      // Notify for first booking
      await notifyBookingEvent(
        createdBookings[0],
        'Recurring Booking Confirmed',
        `Your recurring series "${title}" for "${asset.name}" has been confirmed (${createdBookings.length} occurrences).`,
        NotificationType.SUCCESS,
        sendBookingConfirmationEmail
      );

      res.status(201).json(createdBookings);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/bookings/:id
 * Partially update metadata (e.g. title, priority, remarks, participants)
 */
export async function updateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, priority, remarks, participants, attachment } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Access control
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.ASSET_MANAGER && booking.bookedBy.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Forbidden. You do not have permission to modify this booking.' });
      return;
    }

    const oldData = { ...booking.toJSON() };

    if (title) booking.title = title;
    if (priority) booking.priority = priority;
    if (remarks) booking.remarks = remarks;
    if (participants) booking.participants = participants;
    if (attachment) booking.attachment = attachment;

    await booking.save();

    await ActivityLog.create({
      user: req.user?.userId,
      action: 'BOOKING_UPDATE',
      module: 'BOOKINGS',
      entityId: booking._id.toString(),
      oldData,
      newData: booking,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    socketService.emitToAll('calendar_update', { message: 'Booking details updated', bookingId: booking._id });

    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/bookings/reschedule
 * Reschedule booking dates/times/resources with full conflict validation
 */
export async function rescheduleBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bookingId, startTime, endTime, resourceId, rescheduleSeries = false } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Access control
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.ASSET_MANAGER && booking.bookedBy.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Forbidden. You cannot reschedule this booking.' });
      return;
    }

    const targetResource = resourceId || booking.resource.toString();
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Verify target asset status
    const asset = await Asset.findById(targetResource);
    if (!asset || asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.UNDER_MAINTENANCE) {
      res.status(400).json({ message: 'Selected resource is retired, under maintenance, or invalid.' });
      return;
    }

    if (!rescheduleSeries || !booking.isRecurring || !booking.recurringGroupId) {
      // Single booking reschedule
      const conflictCheck = await ConflictDetectionService.checkConflict(targetResource, start, end, bookingId);
      if (conflictCheck.hasConflict) {
        const suggestions = await ConflictDetectionService.suggestNextAvailableSlots(targetResource, start, end, bookingId);
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
      booking.status = BookingStatus.UPCOMING; // reset status back to upcoming if it was ongoing or changed
      await booking.save();

      await ActivityLog.create({
        user: req.user?.userId,
        action: 'BOOKING_RESCHEDULE',
        module: 'BOOKINGS',
        entityId: booking._id.toString(),
        oldData,
        newData: booking,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      socketService.emitToAll('calendar_update', { message: 'Booking rescheduled', bookingId: booking._id });

      await notifyBookingEvent(
        booking,
        'Booking Rescheduled',
        `Your booking "${booking.title}" has been rescheduled to start on ${start.toLocaleString()}.`,
        NotificationType.INFO,
        sendBookingRescheduledEmail
      );

      res.status(200).json(booking);
    } else {
      // Series reschedule
      const groupId = booking.recurringGroupId;
      const series = await Booking.find({ recurringGroupId: groupId, status: { $ne: BookingStatus.CANCELLED } }).sort({ startTime: 1 });
      
      const durationMs = end.getTime() - start.getTime();
      const offsetMs = start.getTime() - booking.startTime.getTime();

      // Check conflicts for all items
      const conflicts: Array<{ date: string; conflict: any }> = [];
      for (const item of series) {
        const itemNewStart = new Date(item.startTime.getTime() + offsetMs);
        const itemNewEnd = new Date(itemNewStart.getTime() + durationMs);
        
        const conflictCheck = await ConflictDetectionService.checkConflict(targetResource, itemNewStart, itemNewEnd, item._id.toString());
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
        item.status = BookingStatus.UPCOMING;
        await item.save();

        await ActivityLog.create({
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

      socketService.emitToAll('calendar_update', { message: 'Recurring series rescheduled' });

      await notifyBookingEvent(
        updatedItems[0],
        'Recurring Booking Series Rescheduled',
        `Your recurring series "${booking.title}" has been rescheduled.`,
        NotificationType.INFO,
        sendBookingRescheduledEmail
      );

      res.status(200).json(updatedItems);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/bookings/:id
 * Cancel booking and capture details (cancellationReason is required in body)
 */
export async function deleteBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelSeries = false } = req.body;

    if (!cancellationReason) {
      res.status(400).json({ message: 'Cancellation reason is required.' });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Permissions
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.ASSET_MANAGER && booking.bookedBy.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Forbidden. You do not have permission to cancel this booking.' });
      return;
    }

    if (!cancelSeries || !booking.isRecurring || !booking.recurringGroupId) {
      // Cancel single
      const oldData = { ...booking.toJSON() };
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationReason = cancellationReason;
      booking.cancelledBy = req.user?.userId;
      booking.cancelledAt = new Date();
      await booking.save();

      await ActivityLog.create({
        user: req.user?.userId,
        action: 'BOOKING_CANCEL',
        module: 'BOOKINGS',
        entityId: booking._id.toString(),
        oldData,
        newData: booking,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      socketService.emitToAll('calendar_update', { message: 'Booking cancelled', bookingId: booking._id });

      await notifyBookingEvent(
        booking,
        'Booking Cancelled',
        `Booking "${booking.title}" has been cancelled. Reason: ${cancellationReason}`,
        NotificationType.WARNING,
        sendBookingCancellationEmail
      );

      res.status(200).json({ message: 'Booking cancelled successfully', booking });
    } else {
      // Cancel series from current onwards
      const groupId = booking.recurringGroupId;
      const series = await Booking.find({ 
        recurringGroupId: groupId, 
        startTime: { $gte: booking.startTime },
        status: { $ne: BookingStatus.CANCELLED } 
      });

      const cancelledItems = [];
      for (const item of series) {
        const oldData = { ...item.toJSON() };
        item.status = BookingStatus.CANCELLED;
        item.cancellationReason = cancellationReason;
        item.cancelledBy = req.user?.userId;
        item.cancelledAt = new Date();
        await item.save();

        await ActivityLog.create({
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

      socketService.emitToAll('calendar_update', { message: 'Recurring booking series cancelled' });

      await notifyBookingEvent(
        booking,
        'Recurring Booking Series Cancelled',
        `Your recurring series "${booking.title}" has been cancelled. Reason: ${cancellationReason}`,
        NotificationType.WARNING,
        sendBookingCancellationEmail
      );

      res.status(200).json({ message: 'Recurring series cancelled successfully', cancelledCount: cancelledItems.length });
    }
  } catch (error) {
    next(error);
  }
}
