"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const Asset_1 = require("../models/Asset");
const Booking_1 = require("../models/Booking");
class CalendarService {
    /**
     * Retrieves the availability status of a resource for a specific time range.
     */
    static async getResourceStatus(resourceId, startTime, endTime, excludeBookingId) {
        const asset = await Asset_1.Asset.findById(resourceId);
        if (!asset) {
            return { status: 'UNAVAILABLE', detail: 'Resource not found' };
        }
        if (asset.deletedAt) {
            return { status: 'UNAVAILABLE', detail: 'Resource has been deleted' };
        }
        if (!asset.bookable) {
            return { status: 'UNAVAILABLE', detail: 'Resource is not marked as bookable' };
        }
        if (asset.status === Asset_1.AssetStatus.RETIRED || asset.status === Asset_1.AssetStatus.DISPOSED || asset.status === Asset_1.AssetStatus.LOST) {
            return { status: 'UNAVAILABLE', detail: `Resource is retired or unavailable (Status: ${asset.status})` };
        }
        if (asset.status === Asset_1.AssetStatus.UNDER_MAINTENANCE) {
            return { status: 'MAINTENANCE', detail: 'Resource is currently under maintenance' };
        }
        // Check overlaps
        const overlapQuery = {
            resource: resourceId,
            status: { $in: [Booking_1.BookingStatus.UPCOMING, Booking_1.BookingStatus.ONGOING, Booking_1.BookingStatus.COMPLETED] },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        };
        if (excludeBookingId) {
            overlapQuery._id = { $ne: excludeBookingId };
        }
        const overlap = await Booking_1.Booking.findOne(overlapQuery);
        if (overlap) {
            if (overlap.status === Booking_1.BookingStatus.UPCOMING) {
                return { status: 'RESERVED', detail: `Reserved for: "${overlap.title}"` };
            }
            return { status: 'BUSY', detail: `Busy with booking: "${overlap.title}"` };
        }
        return { status: 'AVAILABLE' };
    }
    /**
     * Generates a list of slots for a single day (e.g. 08:00 - 20:00) showing availability for the resource.
     */
    static async getDailyTimeline(resourceId, dateStr) {
        const targetDate = new Date(dateStr);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 8, 0, 0);
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 20, 0, 0);
        const asset = await Asset_1.Asset.findById(resourceId);
        if (!asset || asset.status === Asset_1.AssetStatus.RETIRED || asset.status === Asset_1.AssetStatus.DISPOSED) {
            return [{ time: 'All Day', status: 'UNAVAILABLE' }];
        }
        if (asset.status === Asset_1.AssetStatus.UNDER_MAINTENANCE) {
            return [{ time: 'All Day', status: 'MAINTENANCE' }];
        }
        // Find all bookings for this asset on this date
        const bookings = await Booking_1.Booking.find({
            resource: resourceId,
            status: { $in: [Booking_1.BookingStatus.UPCOMING, Booking_1.BookingStatus.ONGOING, Booking_1.BookingStatus.COMPLETED] },
            startTime: { $lt: endOfDay },
            endTime: { $gt: startOfDay }
        }).sort({ startTime: 1 });
        const timeline = [];
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
                    status: activeBooking.status === Booking_1.BookingStatus.UPCOMING ? 'RESERVED' : 'BUSY',
                    bookingId: activeBooking._id.toString(),
                    title: activeBooking.title
                });
            }
            else {
                timeline.push({
                    time: timeLabel,
                    status: 'AVAILABLE'
                });
            }
        }
        return timeline;
    }
}
exports.CalendarService = CalendarService;
