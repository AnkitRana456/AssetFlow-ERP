"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const allocationController_1 = require("../controllers/allocationController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const allocationValidator_1 = require("../validators/allocationValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive);
// Read allocations (tailored per role in the controller)
router.get('/', allocationController_1.getAllocations);
router.get('/:id', allocationController_1.getAllocationById);
// Write allocations (restricted to Admin and Asset Manager)
router.post('/', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), allocationValidator_1.validateAllocation, validationMiddleware_1.validateRequest, allocationController_1.createAllocation);
router.patch('/:id', (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), allocationController_1.updateAllocation);
exports.default = router;
