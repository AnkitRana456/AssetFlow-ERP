"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogSchema = exports.ActivityLog = void 0;
const mongoose_1 = require("mongoose");
const ActivityLogSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true, index: true },
    entityId: { type: String },
    oldData: { type: mongoose_1.Schema.Types.Mixed },
    newData: { type: mongoose_1.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
exports.ActivityLogSchema = ActivityLogSchema;
// Optimize audit log dashboard historical queries and sort orders
ActivityLogSchema.index({ module: 1, action: 1, createdAt: -1 });
exports.ActivityLog = (0, mongoose_1.model)('ActivityLog', ActivityLogSchema);
