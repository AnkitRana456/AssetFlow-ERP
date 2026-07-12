"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAllocationSchema = exports.AssetAllocation = exports.AllocationStatus = void 0;
const mongoose_1 = require("mongoose");
const Asset_1 = require("./Asset");
var AllocationStatus;
(function (AllocationStatus) {
    AllocationStatus["ACTIVE"] = "ACTIVE";
    AllocationStatus["RETURNED"] = "RETURNED";
    AllocationStatus["OVERDUE"] = "OVERDUE";
})(AllocationStatus || (exports.AllocationStatus = AllocationStatus = {}));
const AssetAllocationAttachmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true }
}, { _id: false });
const AssetAllocationSchema = new mongoose_1.Schema({
    asset: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    employee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    allocatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    allocatedDate: { type: Date, default: Date.now },
    expectedReturn: { type: Date },
    returnedDate: { type: Date },
    returnCondition: {
        type: String,
        enum: Object.values(Asset_1.AssetCondition)
    },
    purpose: { type: String, trim: true },
    notes: { type: String },
    attachments: { type: [AssetAllocationAttachmentSchema], default: [] },
    status: {
        type: String,
        enum: Object.values(AllocationStatus),
        default: AllocationStatus.ACTIVE,
        index: true
    }
}, { timestamps: true });
exports.AssetAllocationSchema = AssetAllocationSchema;
exports.AssetAllocation = (0, mongoose_1.model)('AssetAllocation', AssetAllocationSchema);
