"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const auditValidator_1 = require("../validators/auditValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Secure all paths with standard authentication
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive);
// Scoped reads for analytics and dashboards
router.get('/dashboard', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD), auditController_1.getAuditDashboard);
router.get('/analytics', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), auditController_1.getAuditAnalytics);
// Campaigns management
router.get('/', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD), auditController_1.getAudits);
router.post('/', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), auditValidator_1.validateAuditCycle, validationMiddleware_1.validateRequest, auditController_1.createAudit);
router.get('/:id', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD), auditController_1.getAuditById);
router.post('/:id/start', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), auditController_1.startAudit);
router.post('/:id/close', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), auditValidator_1.validateCloseAudit, validationMiddleware_1.validateRequest, auditController_1.closeAudit);
// Verifications endpoints (Auditors are checked in controller context)
router.post('/:id/verify', auditValidator_1.validateVerification, validationMiddleware_1.validateRequest, auditController_1.verifyAssetItem);
router.post('/:id/bulk-verify', auditController_1.bulkVerifyAssets);
// Reports
router.get('/:id/report', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD), auditController_1.getAuditReport);
exports.default = router;
