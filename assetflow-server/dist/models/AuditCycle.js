"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditCycleSchema = exports.AuditCycle = exports.AuditPriority = exports.AuditCycleType = exports.AuditCycleStatus = void 0;
const mongoose_1 = require("mongoose");
var AuditCycleStatus;
(function (AuditCycleStatus) {
    AuditCycleStatus["DRAFT"] = "DRAFT";
    AuditCycleStatus["SCHEDULED"] = "SCHEDULED";
    AuditCycleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AuditCycleStatus["COMPLETED"] = "COMPLETED";
    AuditCycleStatus["CLOSED"] = "CLOSED";
    AuditCycleStatus["CANCELLED"] = "CANCELLED";
})(AuditCycleStatus || (exports.AuditCycleStatus = AuditCycleStatus = {}));
var AuditCycleType;
(function (AuditCycleType) {
    AuditCycleType["FULL_ORG"] = "FULL_ORG";
    AuditCycleType["DEPARTMENT"] = "DEPARTMENT";
    AuditCycleType["LOCATION"] = "LOCATION";
    AuditCycleType["CATEGORY"] = "CATEGORY";
    AuditCycleType["RANDOM_SAMPLING"] = "RANDOM_SAMPLING";
})(AuditCycleType || (exports.AuditCycleType = AuditCycleType = {}));
var AuditPriority;
(function (AuditPriority) {
    AuditPriority["LOW"] = "LOW";
    AuditPriority["MEDIUM"] = "MEDIUM";
    AuditPriority["HIGH"] = "HIGH";
})(AuditPriority || (exports.AuditPriority = AuditPriority = {}));
const AuditCycleSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
        type: String,
        enum: Object.values(AuditCycleType),
        default: AuditCycleType.FULL_ORG,
        required: true,
        index: true
    },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    location: { type: String },
    categories: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'AssetCategory' }],
    assets: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset' }],
    auditors: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }],
    priority: {
        type: String,
        enum: Object.values(AuditPriority),
        default: AuditPriority.MEDIUM
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
        type: String,
        enum: Object.values(AuditCycleStatus),
        default: AuditCycleStatus.DRAFT,
        index: true
    },
    resolutionNotes: { type: String },
    closedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date }
}, { timestamps: true });
exports.AuditCycleSchema = AuditCycleSchema;
exports.AuditCycle = (0, mongoose_1.model)('AuditCycle', AuditCycleSchema);
