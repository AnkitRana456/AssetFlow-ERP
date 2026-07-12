import { Booking, BookingStatus } from '../models/Booking';
import { Asset, AssetStatus } from '../models/Asset';

export interface IConflictResult {
  hasConflict: boolean;
  conflictingBooking?: any;
}

export class ConflictDetectionService {
  /**
   * Checks if there is any overlapping booking for the given resource in the time range.
   * Excludes the specified booking ID (useful during updates/rescheduling).
   */
  static async checkConflict(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<IConflictResult> {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Conflict Condition: (existingStart < newEnd) AND (existingEnd > newStart)
    const query: any = {
      resource: resourceId,
      status: { $in: [BookingStatus.UPCOMING, BookingStatus.ONGOING, BookingStatus.COMPLETED] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query)
      .populate('bookedBy', 'firstName lastName email')
      .populate('department', 'name code');

    if (conflictingBooking) {
      return {
        hasConflict: true,
        conflictingBooking
      };
    }

    return { hasConflict: false };
  }

  /**
   * Suggests the next 3 available time slots of the same duration.
   * It scans forward in 30-minute steps starting from the original requested startTime.
   */
  static async suggestNextAvailableSlots(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<Array<{ startTime: Date; endTime: Date }>> {
    const durationMs = endTime.getTime() - startTime.getTime();
    const suggestions: Array<{ startTime: Date; endTime: Date }> = [];
    
    // Start searching from requested start time
    let scanStart = new Date(startTime);
    
    // Cap the search to avoid infinite loops (e.g., scan up to 7 days ahead)
    const maxScanDate = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch all active bookings in this 7-day window to check in-memory for speed
    const bookings = await Booking.find({
      resource: resourceId,
      status: { $in: [BookingStatus.UPCOMING, BookingStatus.ONGOING, BookingStatus.COMPLETED] },
      startTime: { $lt: maxScanDate },
      endTime: { $gt: scanStart },
      ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {})
    }).sort({ startTime: 1 });

    while (suggestions.length < 3 && scanStart.getTime() < maxScanDate.getTime()) {
      const scanEnd = new Date(scanStart.getTime() + durationMs);

      // Check if scanStart -> scanEnd overlaps with any active booking in-memory
      const hasOverlap = bookings.some((b) => {
        return b.startTime.getTime() < scanEnd.getTime() && b.endTime.getTime() > scanStart.getTime();
      });

      if (!hasOverlap) {
        suggestions.push({
          startTime: new Date(scanStart),
          endTime: new Date(scanEnd)
        });
      }

      // Advance by 30 minutes
      scanStart = new Date(scanStart.getTime() + 30 * 60 * 1000);
    }

    return suggestions;
  }
}
