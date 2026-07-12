"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const historyController_1 = require("../controllers/historyController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate, authMiddleware_1.checkActive);
// Fetch timeline events for an asset (accessible to all authenticated users)
router.get('/:assetId', historyController_1.getTimelineHistory);
exports.default = router;
