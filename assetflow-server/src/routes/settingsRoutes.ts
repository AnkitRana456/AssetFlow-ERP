import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate, checkActive, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

router.get('/', authenticate, checkActive, getSettings);
router.put('/', authenticate, checkActive, authorize(UserRole.ADMIN), updateSettings);

export default router;
