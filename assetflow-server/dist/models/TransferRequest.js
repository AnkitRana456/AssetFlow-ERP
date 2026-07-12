"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferRequestSchema = exports.TransferRequest = exports.TransferStatus = void 0;
const mongoose_1 = require("mongoose");
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["PENDING"] = "PENDING";
    TransferStatus["APPROVED"] = "APPROVED";
    TransferStatus["REJECTED"] = "REJECTED";
    TransferStatus["COMPLETED"] = "COMPLETED";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
const TransferRequestSchema = new mongoose_1.Schema({
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    requestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromEmployee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    toEmployee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    approvalStatus: {
        type: String,
        enum: Object.values(TransferStatus),
        default: TransferStatus.PENDING,
        index: true
    },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    transferDate: { type: Date },
    remarks: { type: String }
}, { timestamps: true });
exports.TransferRequestSchema = TransferRequestSchema;
exports.TransferRequest = (0, mongoose_1.model)('TransferRequest', TransferRequestSchema);
