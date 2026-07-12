"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.get('/generate', authMiddleware_1.authenticate, authMiddleware_1.checkActive, (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), reportController_1.getReportData);
exports.default = router;
