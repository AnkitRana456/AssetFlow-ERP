"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingSchema = exports.Booking = exports.BookingStatus = void 0;
const mongoose_1 = require("mongoose");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["UPCOMING"] = "UPCOMING";
    BookingStatus["ONGOING"] = "ONGOING";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
const BookingSchema = new mongoose_1.Schema({
    resource: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    bookedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    startTime: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value < this.endTime;
            },
            message: 'Start time must be before end time.'
        }
    },
    endTime: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.UPCOMING,
        index: true
    }
}, { timestamps: true });
exports.BookingSchema = BookingSchema;
// Pre-save Validation Hook to prevent overlapping bookings
BookingSchema.pre('save', async function () {
    const self = this;
    // Skip validation if the booking is cancelled
    if (self.status === BookingStatus.CANCELLED) {
        return;
    }
    // Overlap condition: (new_start < existing_end) AND (new_end > existing_start)
    const overlappingBooking = await (0, mongoose_1.model)('Booking').findOne({
        resource: self.resource,
        status: { $ne: BookingStatus.CANCELLED },
        _id: { $ne: self._id }, // Exclude self if updating
        $or: [
            {
                startTime: { $lt: self.endTime },
                endTime: { $gt: self.startTime }
            }
        ]
    });
    if (overlappingBooking) {
        throw new Error('Overlapping booking error: The selected resource is already booked during this time interval.');
    }
});
exports.Booking = (0, mongoose_1.model)('Booking', BookingSchema);
