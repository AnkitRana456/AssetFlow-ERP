import { Router } from 'express';
import { 
  createReturn, 
  getReturns, 
  approveReturn, 
  rejectReturn 
} from '../controllers/returnController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateReturn } from '../validators/returnValidator';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate, checkActive);

// List return requests
router.get('/', getReturns);

// Request a return (open to all authenticated employees)
router.post(
  '/', 
  validateReturn, 
  validateRequest, 
  createReturn
);

// Review returns (restricted to Admin and Asset Manager)
router.patch(
  '/:id/approve', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  approveReturn
);

router.patch(
  '/:id/reject', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  rejectReturn
);

export default router;
