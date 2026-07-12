"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditItemSchema = exports.AuditItem = exports.DiscrepancyType = exports.AuditVerificationStatus = void 0;
const mongoose_1 = require("mongoose");
var AuditVerificationStatus;
(function (AuditVerificationStatus) {
    AuditVerificationStatus["PENDING"] = "PENDING";
    AuditVerificationStatus["VERIFIED"] = "VERIFIED";
    AuditVerificationStatus["MISSING"] = "MISSING";
    AuditVerificationStatus["DAMAGED"] = "DAMAGED";
    AuditVerificationStatus["DISPOSED"] = "DISPOSED";
    AuditVerificationStatus["DUPLICATE"] = "DUPLICATE";
})(AuditVerificationStatus || (exports.AuditVerificationStatus = AuditVerificationStatus = {}));
var DiscrepancyType;
(function (DiscrepancyType) {
    DiscrepancyType["WRONG_LOCATION"] = "WRONG_LOCATION";
    DiscrepancyType["WRONG_DEPARTMENT"] = "WRONG_DEPARTMENT";
    DiscrepancyType["WRONG_HOLDER"] = "WRONG_HOLDER";
    DiscrepancyType["NONE"] = "NONE";
})(DiscrepancyType || (exports.DiscrepancyType = DiscrepancyType = {}));
const AuditItemSchema = new mongoose_1.Schema({
    auditCycle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true },
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    auditor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: {
        type: String,
        enum: Object.values(AuditVerificationStatus),
        default: AuditVerificationStatus.PENDING,
        index: true
    },
    discrepancyType: {
        type: String,
        enum: Object.values(DiscrepancyType),
        default: DiscrepancyType.NONE,
        index: true
    },
    isUnexpected: { type: Boolean, default: false, index: true },
    auditorNotes: { type: String, trim: true },
    managerNotes: { type: String, trim: true },
    verifiedAt: { type: Date }
}, { timestamps: true });
exports.AuditItemSchema = AuditItemSchema;
exports.AuditItem = (0, mongoose_1.model)('AuditItem', AuditItemSchema);
