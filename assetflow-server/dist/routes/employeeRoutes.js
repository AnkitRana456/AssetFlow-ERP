"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController_1 = require("../controllers/employeeController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const orgValidator_1 = require("../validators/orgValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all routes: Admin only
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive, (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN));
router.get('/', employeeController_1.getEmployees);
router.get('/:id', employeeController_1.getEmployeeById);
router.patch('/:id', orgValidator_1.validateEmployeeUpdate, validationMiddleware_1.validateRequest, employeeController_1.updateEmployee);
router.patch('/promote/:id', orgValidator_1.validateEmployeePromotion, validationMiddleware_1.validateRequest, employeeController_1.promoteEmployee);
router.patch('/status/:id', orgValidator_1.validateEmployeeStatus, validationMiddleware_1.validateRequest, employeeController_1.updateEmployeeStatus);
exports.default = router;
