"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transferController_1 = require("../controllers/transferController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const transferValidator_1 = require("../validators/transferValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive);
// List transfers
router.get('/', transferController_1.getTransfers);
// Request transfer (open to all authenticated users)
router.post('/', transferValidator_1.validateTransfer, validationMiddleware_1.validateRequest, transferController_1.createTransfer);
// Approve / Reject (available to Department Head, Asset Manager, and Admin)
router.patch('/:id/approve', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD), transferController_1.approveTransfer);
router.patch('/:id/reject', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD), transferController_1.rejectTransfer);
// Finalize Transfer (restricted to Admin and Asset Manager)
router.patch('/:id/complete', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), transferController_1.completeTransfer);
exports.default = router;
