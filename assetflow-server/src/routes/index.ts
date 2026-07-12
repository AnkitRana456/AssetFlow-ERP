import { Router } from 'express';
import departmentRoutes from './departmentRoutes';
import categoryRoutes from './categoryRoutes';
import employeeRoutes from './employeeRoutes';
import assetRoutes from './assetRoutes';
import allocationRoutes from './allocationRoutes';
import transferRoutes from './transferRoutes';
import returnRoutes from './returnRoutes';
import historyRoutes from './historyRoutes';

const router = Router();

// Register organization setup and asset sub-routers
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/employees', employeeRoutes);
router.use('/assets', assetRoutes);
router.use('/allocations', allocationRoutes);
router.use('/transfers', transferRoutes);
router.use('/returns', returnRoutes);
router.use('/history', historyRoutes);


// Base api welcome check
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to AssetFlow API' });
});

export default router;
