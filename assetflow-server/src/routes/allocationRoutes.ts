import { Router } from 'express';
import { 
  createAllocation, 
  getAllocations, 
  getAllocationById, 
  updateAllocation 
} from '../controllers/allocationController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateAllocation } from '../validators/allocationValidator';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate, checkActive);

// Read allocations (tailored per role in the controller)
router.get('/', getAllocations);
router.get('/:id', getAllocationById);

// Write allocations (restricted to Admin and Asset Manager)
router.post(
  '/', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  validateAllocation, 
  validateRequest, 
  createAllocation
);

router.patch(
  '/:id', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  updateAllocation
);

export default router;
