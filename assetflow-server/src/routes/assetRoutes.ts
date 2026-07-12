import { Router } from 'express';
import { 
  getAssets, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  deleteAsset, 
  importAssets, 
  exportAssets, 
  getAssetHistory 
} from '../controllers/assetController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { assetUpload, upload } from '../middlewares/uploadMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateAsset } from '../validators/assetValidator';
import { UserRole } from '../models/User';

const router = Router();

// Base checks for all asset interactions
router.use(authenticate, checkActive);

// Reads: Open to all authenticated users (internal controller filters by user role scope)
router.get('/', getAssets);
router.get('/export', exportAssets);
router.get('/history/:id', getAssetHistory);
router.get('/:id', getAssetById);

// Writes: Limited to Admin and Asset Manager roles
router.post(
  '/', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  assetUpload, 
  validateAsset, 
  validateRequest, 
  createAsset
);
router.patch(
  '/:id', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  assetUpload, 
  validateAsset, 
  validateRequest, 
  updateAsset
);
router.delete(
  '/:id', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  deleteAsset
);

// Bulk Import: Admin and Asset Manager only
router.post(
  '/import', 
  authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER), 
  upload.single('file'), 
  importAssets
);

export default router;
