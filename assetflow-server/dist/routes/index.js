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
// Base api welcome check
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to AssetFlow API' });
});
exports.default = router;
