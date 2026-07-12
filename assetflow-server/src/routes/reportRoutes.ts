import { Router } from 'express';
import { getReportData } from '../controllers/reportController';
import { authenticate, checkActive, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

router.get('/generate', authenticate, checkActive, authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), getReportData);

export default router;
