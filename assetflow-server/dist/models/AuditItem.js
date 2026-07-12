"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditItemSchema = exports.AuditItem = exports.AuditVerificationStatus = void 0;
const mongoose_1 = require("mongoose");
var AuditVerificationStatus;
(function (AuditVerificationStatus) {
    AuditVerificationStatus["VERIFIED"] = "VERIFIED";
    AuditVerificationStatus["MISSING"] = "MISSING";
    AuditVerificationStatus["DAMAGED"] = "DAMAGED";
})(AuditVerificationStatus || (exports.AuditVerificationStatus = AuditVerificationStatus = {}));
const AuditItemSchema = new mongoose_1.Schema({
    auditCycle: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AuditCycle', required: true, index: true },
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    auditor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: {
        type: String,
        enum: Object.values(AuditVerificationStatus),
        default: AuditVerificationStatus.VERIFIED,
        index: true
    },
    remarks: { type: String },
    verifiedAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.AuditItemSchema = AuditItemSchema;
exports.AuditItem = (0, mongoose_1.model)('AuditItem', AuditItemSchema);
