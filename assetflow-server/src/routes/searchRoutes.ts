import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { authenticate, checkActive } from '../middlewares/authMiddleware';

const router = Router();

router.get('/global', authenticate, checkActive, globalSearch);

export default router;
