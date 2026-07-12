"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const orgValidator_1 = require("../validators/orgValidator");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all routes: Admin only
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive, (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN));
router.get('/', categoryController_1.getCategories);
router.post('/', orgValidator_1.validateCategory, validationMiddleware_1.validateRequest, categoryController_1.createCategory);
router.get('/:id', categoryController_1.getCategoryById);
router.patch('/:id', orgValidator_1.validateCategory, validationMiddleware_1.validateRequest, categoryController_1.updateCategory);
router.delete('/:id', categoryController_1.deleteCategory);
exports.default = router;
