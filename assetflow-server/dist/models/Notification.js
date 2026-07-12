"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchema = exports.Notification = exports.NotificationType = void 0;
const mongoose_1 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "INFO";
    NotificationType["SUCCESS"] = "SUCCESS";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["ERROR"] = "ERROR";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const NotificationSchema = new mongoose_1.Schema({
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        default: NotificationType.INFO,
        index: true
    },
    read: { type: Boolean, default: false, index: true },
    link: { type: String }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
exports.NotificationSchema = NotificationSchema;
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
