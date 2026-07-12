"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/executive', authMiddleware_1.authenticate, authMiddleware_1.checkActive, dashboardController_1.getExecutiveStats);
exports.default = router;
