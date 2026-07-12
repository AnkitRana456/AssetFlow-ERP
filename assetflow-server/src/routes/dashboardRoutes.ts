import { Router } from 'express';
import { getExecutiveStats } from '../controllers/dashboardController';
import { authenticate, checkActive } from '../middlewares/authMiddleware';

const router = Router();

router.get('/executive', authenticate, checkActive, getExecutiveStats);

export default router;
