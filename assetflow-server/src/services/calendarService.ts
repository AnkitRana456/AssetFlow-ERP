import { Asset, AssetStatus } from '../models/Asset';
import { Booking, BookingStatus } from '../models/Booking';

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'RESERVED' | 'UNAVAILABLE';

export class CalendarService {
  /**
   * Retrieves the availability status of a resource for a specific time range.
   */
  static async getResourceStatus(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<{ status: AvailabilityStatus; detail?: string }> {
    const asset = await Asset.findById(resourceId);
    if (!asset) {
      return { status: 'UNAVAILABLE', detail: 'Resource not found' };
    }

    if (asset.deletedAt) {
      return { status: 'UNAVAILABLE', detail: 'Resource has been deleted' };
    }

    if (!asset.bookable) {
      return { status: 'UNAVAILABLE', detail: 'Resource is not marked as bookable' };
    }

    if (asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED || asset.status === AssetStatus.LOST) {
      return { status: 'UNAVAILABLE', detail: `Resource is retired or unavailable (Status: ${asset.status})` };
    }

    if (asset.status === AssetStatus.UNDER_MAINTENANCE) {
      return { status: 'MAINTENANCE', detail: 'Resource is currently under maintenance' };
    }

    // Check overlaps
    const overlapQuery: any = {
      resource: resourceId,
      status: { $in: [BookingStatus.UPCOMING, BookingStatus.ONGOING, BookingStatus.COMPLETED] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    };

    if (excludeBookingId) {
      overlapQuery._id = { $ne: excludeBookingId };
    }

    const overlap = await Booking.findOne(overlapQuery);
    if (overlap) {
      if (overlap.status === BookingStatus.UPCOMING) {
        return { status: 'RESERVED', detail: `Reserved for: "${overlap.title}"` };
      }
      return { status: 'BUSY', detail: `Busy with booking: "${overlap.title}"` };
    }

    return { status: 'AVAILABLE' };
  }

  /**
   * Generates a list of slots for a single day (e.g. 08:00 - 20:00) showing availability for the resource.
   */
  static async getDailyTimeline(resourceId: string, dateStr: string): Promise<Array<{ time: string; status: AvailabilityStatus; bookingId?: string; title?: string }>> {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 8, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 20, 0, 0);

    const asset = await Asset.findById(resourceId);
    if (!asset || asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED) {
      return [{ time: 'All Day', status: 'UNAVAILABLE' }];
    }

    if (asset.status === AssetStatus.UNDER_MAINTENANCE) {
      return [{ time: 'All Day', status: 'MAINTENANCE' }];
    }

    // Find all bookings for this asset on this date
    const bookings = await Booking.find({
      resource: resourceId,
      status: { $in: [BookingStatus.UPCOMING, BookingStatus.ONGOING, BookingStatus.COMPLETED] },
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay }
    }).sort({ startTime: 1 });

    const timeline: Array<{ time: string; status: AvailabilityStatus; bookingId?: string; title?: string }> = [];

    // Create 1-hour slots
    for (let hour = 8; hour < 20; hour++) {
      const slotStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0, 0);
      const slotEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour + 1, 0, 0);
      
      const timeLabel = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;

      // Find booking covering this slot
      const activeBooking = bookings.find(b => b.startTime < slotEnd && b.endTime > slotStart);

      if (activeBooking) {
        timeline.push({
          time: timeLabel,
          status: activeBooking.status === BookingStatus.UPCOMING ? 'RESERVED' : 'BUSY',
          bookingId: activeBooking._id.toString(),
          title: activeBooking.title
        });
      } else {
        timeline.push({
          time: timeLabel,
          status: 'AVAILABLE'
        });
      }
    }

    return timeline;
  }
}
