import { Router } from 'express';
import { getNotifications, markAsRead, deleteNotification, deleteAllNotifications } from '../controllers/notificationController';
import { authenticate, checkActive } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, checkActive, getNotifications);
router.post('/mark-read', authenticate, checkActive, markAsRead);
router.delete('/', authenticate, checkActive, deleteAllNotifications);
router.delete('/:id', authenticate, checkActive, deleteNotification);

export default router;
