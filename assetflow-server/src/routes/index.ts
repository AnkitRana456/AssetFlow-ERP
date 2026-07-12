import { Router } from 'express';
import departmentRoutes from './departmentRoutes';
import categoryRoutes from './categoryRoutes';
import employeeRoutes from './employeeRoutes';
import assetRoutes from './assetRoutes';

const router = Router();

// Register organization setup and asset sub-routers
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/employees', employeeRoutes);
router.use('/assets', assetRoutes);

// Base api welcome check
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to AssetFlow API' });
});

export default router;
