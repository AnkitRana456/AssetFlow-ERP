import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chatWithGemini } from '../controllers/aiController';
import { authenticate, checkActive } from '../middlewares/authMiddleware';

const router = Router();

// Strict rate-limiting for expensive AI processing (Gemini API calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 queries per minute per user/IP
  message: { message: 'Too many queries to the AI Assistant. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/chat', authenticate, checkActive, aiLimiter, chatWithGemini);

export default router;
