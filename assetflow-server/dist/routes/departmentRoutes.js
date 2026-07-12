"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/departmentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const orgValidator_1 = require("../validators/orgValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all routes: Admin only
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive, (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN));
router.get('/', departmentController_1.getDepartments);
router.post('/', orgValidator_1.validateDepartment, validationMiddleware_1.validateRequest, departmentController_1.createDepartment);
router.get('/:id', departmentController_1.getDepartmentById);
router.patch('/:id', orgValidator_1.validateDepartment, validationMiddleware_1.validateRequest, departmentController_1.updateDepartment);
router.delete('/:id', departmentController_1.deleteDepartment);
exports.default = router;
