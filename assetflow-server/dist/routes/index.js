"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentRoutes_1 = __importDefault(require("./departmentRoutes"));
const categoryRoutes_1 = __importDefault(require("./categoryRoutes"));
const employeeRoutes_1 = __importDefault(require("./employeeRoutes"));
const assetRoutes_1 = __importDefault(require("./assetRoutes"));
const allocationRoutes_1 = __importDefault(require("./allocationRoutes"));
const transferRoutes_1 = __importDefault(require("./transferRoutes"));
const returnRoutes_1 = __importDefault(require("./returnRoutes"));
const historyRoutes_1 = __importDefault(require("./historyRoutes"));
const bookingRoutes_1 = __importDefault(require("./bookingRoutes"));
const auditRoutes_1 = __importDefault(require("./auditRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const activityLogRoutes_1 = __importDefault(require("./activityLogRoutes"));
const aiRoutes_1 = __importDefault(require("./aiRoutes"));
const settingsRoutes_1 = __importDefault(require("./settingsRoutes"));
const searchRoutes_1 = __importDefault(require("./searchRoutes"));
const router = (0, express_1.Router)();
// Register organization setup and asset sub-routers
router.use('/departments', departmentRoutes_1.default);
router.use('/categories', categoryRoutes_1.default);
router.use('/employees', employeeRoutes_1.default);
router.use('/assets', assetRoutes_1.default);
router.use('/allocations', allocationRoutes_1.default);
router.use('/transfers', transferRoutes_1.default);
router.use('/returns', returnRoutes_1.default);
router.use('/history', historyRoutes_1.default);
router.use('/bookings', bookingRoutes_1.default);
router.use('/audits', auditRoutes_1.default);
router.use('/dashboard', dashboardRoutes_1.default);
router.use('/reports', reportRoutes_1.default);
router.use('/notifications', notificationRoutes_1.default);
router.use('/activity-logs', activityLogRoutes_1.default);
router.use('/ai', aiRoutes_1.default);
router.use('/settings', settingsRoutes_1.default);
router.use('/search', searchRoutes_1.default);
// Base api welcome check
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to AssetFlow API' });
});
exports.default = router;
