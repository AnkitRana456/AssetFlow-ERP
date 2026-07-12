"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictDetectionService = void 0;
const Booking_1 = require("../models/Booking");
class ConflictDetectionService {
    /**
     * Checks if there is any overlapping booking for the given resource in the time range.
     * Excludes the specified booking ID (useful during updates/rescheduling).
     */
    static async checkConflict(resourceId, startTime, endTime, excludeBookingId) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        // Conflict Condition: (existingStart < newEnd) AND (existingEnd > newStart)
        const query = {
            resource: resourceId,
            status: { $in: [Booking_1.BookingStatus.UPCOMING, Booking_1.BookingStatus.ONGOING, Booking_1.BookingStatus.COMPLETED] },
            startTime: { $lt: end },
            endTime: { $gt: start }
        };
        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }
        const conflictingBooking = await Booking_1.Booking.findOne(query)
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
    static async suggestNextAvailableSlots(resourceId, startTime, endTime, excludeBookingId) {
        const durationMs = endTime.getTime() - startTime.getTime();
        const suggestions = [];
        // Start searching from requested start time
        let scanStart = new Date(startTime);
        // Cap the search to avoid infinite loops (e.g., scan up to 7 days ahead)
        const maxScanDate = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        // Fetch all active bookings in this 7-day window to check in-memory for speed
        const bookings = await Booking_1.Booking.find({
            resource: resourceId,
            status: { $in: [Booking_1.BookingStatus.UPCOMING, Booking_1.BookingStatus.ONGOING, Booking_1.BookingStatus.COMPLETED] },
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
exports.ConflictDetectionService = ConflictDetectionService;
