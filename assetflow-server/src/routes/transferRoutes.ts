import { Router } from 'express';
import { 
  createTransfer, 
  getTransfers, 
  approveTransfer, 
  rejectTransfer, 
  completeTransfer 
} from '../controllers/transferController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateTransfer } from '../validators/transferValidator';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate, checkActive);

// List transfers
router.get('/', getTransfers);

// Request transfer (open to all authenticated users)
router.post(
  '/', 
  validateTransfer, 
  validateRequest, 
  createTransfer
);

// Approve / Reject (available to Department Head, Asset Manager, and Admin)
router.patch(
  '/:id/approve', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD), 
  approveTransfer
);

router.patch(
  '/:id/reject', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD), 
  rejectTransfer
);

// Finalize Transfer (restricted to Admin and Asset Manager)
router.patch(
  '/:id/complete', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  completeTransfer
);

export default router;
