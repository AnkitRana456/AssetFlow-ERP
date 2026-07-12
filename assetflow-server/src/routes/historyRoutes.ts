import { Router } from 'express';
import { getTimelineHistory } from '../controllers/historyController';
import { authenticate, checkActive } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate, checkActive);

// Fetch timeline events for an asset (accessible to all authenticated users)
router.get('/:assetId', getTimelineHistory);


export default router;
