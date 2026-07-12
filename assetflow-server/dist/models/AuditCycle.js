"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditCycleSchema = exports.AuditCycle = exports.AuditCycleStatus = void 0;
const mongoose_1 = require("mongoose");
var AuditCycleStatus;
(function (AuditCycleStatus) {
    AuditCycleStatus["DRAFT"] = "DRAFT";
    AuditCycleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AuditCycleStatus["COMPLETED"] = "COMPLETED";
    AuditCycleStatus["CANCELLED"] = "CANCELLED";
})(AuditCycleStatus || (exports.AuditCycleStatus = AuditCycleStatus = {}));
const AuditCycleSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String },
    auditors: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
        type: String,
        enum: Object.values(AuditCycleStatus),
        default: AuditCycleStatus.DRAFT,
        index: true
    },
    closedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date }
}, { timestamps: true });
exports.AuditCycleSchema = AuditCycleSchema;
exports.AuditCycle = (0, mongoose_1.model)('AuditCycle', AuditCycleSchema);
