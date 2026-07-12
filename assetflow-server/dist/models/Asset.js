"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetSchema = exports.Asset = exports.AssetStatus = exports.AssetCondition = void 0;
const mongoose_1 = require("mongoose");
var AssetCondition;
(function (AssetCondition) {
    AssetCondition["NEW"] = "NEW";
    AssetCondition["EXCELLENT"] = "EXCELLENT";
    AssetCondition["GOOD"] = "GOOD";
    AssetCondition["FAIR"] = "FAIR";
    AssetCondition["POOR"] = "POOR";
})(AssetCondition || (exports.AssetCondition = AssetCondition = {}));
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["AVAILABLE"] = "AVAILABLE";
    AssetStatus["ALLOCATED"] = "ALLOCATED";
    AssetStatus["RESERVED"] = "RESERVED";
    AssetStatus["UNDER_MAINTENANCE"] = "UNDER_MAINTENANCE";
    AssetStatus["LOST"] = "LOST";
    AssetStatus["RETIRED"] = "RETIRED";
    AssetStatus["DISPOSED"] = "DISPOSED";
})(AssetStatus || (exports.AssetStatus = AssetStatus = {}));
const AssetDocumentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true }
}, { _id: false });
const AssetSchema = new mongoose_1.Schema({
    assetTag: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    qrCode: { type: String },
    barcode: { type: String },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AssetCategory', required: true, index: true },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department', index: true },
    currentHolder: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    location: { type: String },
    condition: {
        type: String,
        enum: Object.values(AssetCondition),
        default: AssetCondition.NEW
    },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    vendor: { type: String },
    bookable: { type: Boolean, default: false },
    description: { type: String },
    status: {
        type: String,
        enum: Object.values(AssetStatus),
        default: AssetStatus.AVAILABLE,
        index: true
    },
    photo: { type: String },
    documents: [AssetDocumentSchema],
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    retirementDate: { type: Date },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
exports.AssetSchema = AssetSchema;
// Optimize global full-text search queries
AssetSchema.index({ name: 'text', serialNumber: 'text', assetTag: 'text', location: 'text' });
// Soft Delete Middleware (Query hooks)
AssetSchema.pre(/^find/, function (next) {
    const query = this;
    if (query.getFilter().deletedAt === undefined) {
        query.where({ deletedAt: null });
    }
    next();
});
exports.Asset = (0, mongoose_1.model)('Asset', AssetSchema);
