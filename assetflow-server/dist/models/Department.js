"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Department = exports.DepartmentStatus = void 0;
const mongoose_1 = require("mongoose");
var DepartmentStatus;
(function (DepartmentStatus) {
    DepartmentStatus["ACTIVE"] = "ACTIVE";
    DepartmentStatus["INACTIVE"] = "INACTIVE";
})(DepartmentStatus || (exports.DepartmentStatus = DepartmentStatus = {}));
const DepartmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String },
    parentDepartment: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    departmentHead: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: Object.values(DepartmentStatus),
        default: DepartmentStatus.ACTIVE
    },
    location: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
// Soft Delete Middleware (Query hooks)
DepartmentSchema.pre(/^find/, function (next) {
    const query = this;
    if (query.getFilter().deletedAt === undefined) {
        query.where({ deletedAt: null });
    }
    next();
});
exports.Department = (0, mongoose_1.model)('Department', DepartmentSchema);
