"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceRequestSchema = exports.MaintenanceRequest = exports.MaintenanceStatus = exports.MaintenancePriority = void 0;
const mongoose_1 = require("mongoose");
var MaintenancePriority;
(function (MaintenancePriority) {
    MaintenancePriority["LOW"] = "LOW";
    MaintenancePriority["MEDIUM"] = "MEDIUM";
    MaintenancePriority["HIGH"] = "HIGH";
    MaintenancePriority["CRITICAL"] = "CRITICAL";
})(MaintenancePriority || (exports.MaintenancePriority = MaintenancePriority = {}));
var MaintenanceStatus;
(function (MaintenanceStatus) {
    MaintenanceStatus["PENDING"] = "PENDING";
    MaintenanceStatus["APPROVED"] = "APPROVED";
    MaintenanceStatus["REJECTED"] = "REJECTED";
    MaintenanceStatus["ASSIGNED"] = "ASSIGNED";
    MaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MaintenanceStatus["RESOLVED"] = "RESOLVED";
})(MaintenanceStatus || (exports.MaintenanceStatus = MaintenanceStatus = {}));
const MaintenanceRequestSchema = new mongoose_1.Schema({
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    raisedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    priority: {
        type: String,
        enum: Object.values(MaintenancePriority),
        default: MaintenancePriority.MEDIUM,
        index: true
    },
    issue: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
    approvalStatus: {
        type: String,
        enum: Object.values(MaintenanceStatus),
        default: MaintenanceStatus.PENDING,
        index: true
    },
    technician: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    remarks: { type: String }
}, { timestamps: true });
exports.MaintenanceRequestSchema = MaintenanceRequestSchema;
exports.MaintenanceRequest = (0, mongoose_1.model)('MaintenanceRequest', MaintenanceRequestSchema);
