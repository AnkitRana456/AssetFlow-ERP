"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const returnController_1 = require("../controllers/returnController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const returnValidator_1 = require("../validators/returnValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive);
// List return requests
router.get('/', returnController_1.getReturns);
// Request a return (open to all authenticated employees)
router.post('/', returnValidator_1.validateReturn, validationMiddleware_1.validateRequest, returnController_1.createReturn);
// Review returns (restricted to Admin and Asset Manager)
router.patch('/:id/approve', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), returnController_1.approveReturn);
router.patch('/:id/reject', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), returnController_1.rejectReturn);
exports.default = router;
