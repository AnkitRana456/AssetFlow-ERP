import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController';
import { authenticate, checkActive, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

router.get('/', authenticate, checkActive, authorize(UserRole.ADMIN), getActivityLogs);

export default router;
