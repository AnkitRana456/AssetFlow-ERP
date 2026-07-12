"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnRequestSchema = exports.ReturnRequest = exports.ReturnCondition = exports.ReturnRequestStatus = void 0;
const mongoose_1 = require("mongoose");
var ReturnRequestStatus;
(function (ReturnRequestStatus) {
    ReturnRequestStatus["PENDING"] = "PENDING";
    ReturnRequestStatus["APPROVED"] = "APPROVED";
    ReturnRequestStatus["REJECTED"] = "REJECTED";
})(ReturnRequestStatus || (exports.ReturnRequestStatus = ReturnRequestStatus = {}));
var ReturnCondition;
(function (ReturnCondition) {
    ReturnCondition["EXCELLENT"] = "EXCELLENT";
    ReturnCondition["GOOD"] = "GOOD";
    ReturnCondition["MINOR_DAMAGE"] = "MINOR_DAMAGE";
    ReturnCondition["MAJOR_DAMAGE"] = "MAJOR_DAMAGE";
    ReturnCondition["LOST"] = "LOST";
})(ReturnCondition || (exports.ReturnCondition = ReturnCondition = {}));
const ReturnRequestAttachmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true }
}, { _id: false });
const ReturnRequestSchema = new mongoose_1.Schema({
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    employee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    allocation: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AssetAllocation', required: true, index: true },
    returnNotes: { type: String },
    condition: {
        type: String,
        enum: Object.values(ReturnCondition),
        required: true
    },
    photos: { type: [ReturnRequestAttachmentSchema], default: [] },
    status: {
        type: String,
        enum: Object.values(ReturnRequestStatus),
        default: ReturnRequestStatus.PENDING,
        index: true
    },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    remarks: { type: String }
}, { timestamps: true });
exports.ReturnRequestSchema = ReturnRequestSchema;
exports.ReturnRequest = (0, mongoose_1.model)('ReturnRequest', ReturnRequestSchema);
