import { Router } from 'express';
import departmentRoutes from './departmentRoutes';
import categoryRoutes from './categoryRoutes';
import employeeRoutes from './employeeRoutes';
import assetRoutes from './assetRoutes';
import allocationRoutes from './allocationRoutes';
import transferRoutes from './transferRoutes';
import returnRoutes from './returnRoutes';
import historyRoutes from './historyRoutes';
import bookingRoutes from './bookingRoutes';
import auditRoutes from './auditRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportRoutes from './reportRoutes';
import notificationRoutes from './notificationRoutes';
import activityLogRoutes from './activityLogRoutes';
import aiRoutes from './aiRoutes';
import settingsRoutes from './settingsRoutes';
import searchRoutes from './searchRoutes';

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
router.use('/bookings', bookingRoutes);
router.use('/audits', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);
router.use('/search', searchRoutes);

// Base api welcome check
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to AssetFlow API' });
});

export default router;

