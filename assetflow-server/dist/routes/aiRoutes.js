"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Strict rate-limiting for expensive AI processing (Gemini API calls)
const aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit to 10 queries per minute per user/IP
    message: { message: 'Too many queries to the AI Assistant. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false
});
router.post('/chat', authMiddleware_1.authenticate, authMiddleware_1.checkActive, aiLimiter, aiController_1.chatWithGemini);
exports.default = router;
