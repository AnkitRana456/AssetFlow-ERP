"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetCategorySchema = exports.AssetCategory = exports.CategoryStatus = void 0;
const mongoose_1 = require("mongoose");
var CategoryStatus;
(function (CategoryStatus) {
    CategoryStatus["ACTIVE"] = "ACTIVE";
    CategoryStatus["INACTIVE"] = "INACTIVE";
})(CategoryStatus || (exports.CategoryStatus = CategoryStatus = {}));
const CustomFieldDefSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'],
        required: true
    },
    required: { type: Boolean, default: false }
}, { _id: false });
const AssetCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String },
    icon: { type: String, default: 'package' },
    customFields: [CustomFieldDefSchema],
    maintenanceInterval: { type: Number, default: 90 },
    status: {
        type: String,
        enum: Object.values(CategoryStatus),
        default: CategoryStatus.ACTIVE
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
exports.AssetCategorySchema = AssetCategorySchema;
// Soft Delete Middleware (Query hooks)
AssetCategorySchema.pre(/^find/, function (next) {
    const query = this;
    if (query.getFilter().deletedAt === undefined) {
        query.where({ deletedAt: null });
    }
    next();
});
exports.AssetCategory = (0, mongoose_1.model)('AssetCategory', AssetCategorySchema);
