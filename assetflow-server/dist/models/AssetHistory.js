"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetHistorySchema = exports.AssetHistory = void 0;
const mongoose_1 = require("mongoose");
const AssetHistorySchema = new mongoose_1.Schema({
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    performedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    details: { type: String, required: true },
    allocation: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AssetAllocation' },
    transfer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TransferRequest' },
    returnRequest: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ReturnRequest' }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
exports.AssetHistorySchema = AssetHistorySchema;
exports.AssetHistory = (0, mongoose_1.model)('AssetHistory', AssetHistorySchema);
