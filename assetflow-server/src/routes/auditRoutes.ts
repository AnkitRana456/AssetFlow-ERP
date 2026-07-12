import { Router } from 'express';
import { 
  getAudits, 
  getAuditById, 
  createAudit, 
  startAudit, 
  verifyAssetItem, 
  bulkVerifyAssets, 
  getAuditReport, 
  closeAudit, 
  getAuditDashboard, 
  getAuditAnalytics 
} from '../controllers/auditController';
import { authenticate, checkActive, authorize } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateAuditCycle, validateVerification, validateCloseAudit } from '../validators/auditValidator';
import { UserRole } from '../models/User';

const router = Router();

// Secure all paths with standard authentication
router.use(authenticate, checkActive);

// Scoped reads for analytics and dashboards
router.get('/dashboard', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD), getAuditDashboard);
router.get('/analytics', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), getAuditAnalytics);

// Campaigns management
router.get('/', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD), getAudits);
router.post('/', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), validateAuditCycle, validateRequest, createAudit);

router.get('/:id', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD), getAuditById);
router.post('/:id/start', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), startAudit);
router.post('/:id/close', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), validateCloseAudit, validateRequest, closeAudit);

// Verifications endpoints (Auditors are checked in controller context)
router.post('/:id/verify', validateVerification, validateRequest, verifyAssetItem);
router.post('/:id/bulk-verify', bulkVerifyAssets);

// Reports
router.get('/:id/report', authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD), getAuditReport);

export default router;
