"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingSchema = exports.Booking = exports.RecurrencePattern = exports.BookingPriority = exports.BookingStatus = void 0;
const mongoose_1 = require("mongoose");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["UPCOMING"] = "UPCOMING";
    BookingStatus["ONGOING"] = "ONGOING";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["REJECTED"] = "REJECTED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var BookingPriority;
(function (BookingPriority) {
    BookingPriority["LOW"] = "LOW";
    BookingPriority["MEDIUM"] = "MEDIUM";
    BookingPriority["HIGH"] = "HIGH";
})(BookingPriority || (exports.BookingPriority = BookingPriority = {}));
var RecurrencePattern;
(function (RecurrencePattern) {
    RecurrencePattern["DAILY"] = "DAILY";
    RecurrencePattern["WEEKLY"] = "WEEKLY";
    RecurrencePattern["MONTHLY"] = "MONTHLY";
})(RecurrencePattern || (exports.RecurrencePattern = RecurrencePattern = {}));
const BookingSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    resource: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    bookedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true,
        index: true
    },
    date: { type: Date, required: true, index: true },
    priority: {
        type: String,
        enum: Object.values(BookingPriority),
        default: BookingPriority.MEDIUM
    },
    remarks: { type: String, trim: true },
    attachment: { type: String },
    status: {
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.UPCOMING,
        index: true
    },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    isRecurring: { type: Boolean, default: false, index: true },
    recurringGroupId: { type: String, index: true },
    recurrencePattern: {
        type: String,
        enum: Object.values(RecurrencePattern),
        required: function () { return this.isRecurring; }
    },
    recurrenceUntil: { type: Date }
}, { timestamps: true });
exports.BookingSchema = BookingSchema;
// Optimize booking calendar query intervals and resource conflict validation
BookingSchema.index({ resource: 1, startTime: 1, endTime: 1, status: 1 });
exports.Booking = (0, mongoose_1.model)('Booking', BookingSchema);
