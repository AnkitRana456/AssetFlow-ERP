"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../controllers/searchController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/global', authMiddleware_1.authenticate, authMiddleware_1.checkActive, searchController_1.globalSearch);
exports.default = router;
