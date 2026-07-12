"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activityLogController_1 = require("../controllers/activityLogController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authenticate, authMiddleware_1.checkActive, (0, authMiddleware_1.authorize)(User_1.UserRole.ADMIN), activityLogController_1.getActivityLogs);
exports.default = router;
